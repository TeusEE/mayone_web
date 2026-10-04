import { jsonResponse, readJsonRequestBody } from "@/lib/http";
import { join } from "node:path";
import { checkAdminApiRequest } from "@/lib/admin-auth";
import { parseAdminMockClassOfferInput } from "@/lib/admin-mock-class-offer-input";
import { deleteMockClassOffer, updateMockClassOffer } from "@/lib/mock-class-offer-store";
import { deleteSupabaseClassOffer, hasSupabaseStorageConfiguration, updateSupabaseClassOffer } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16_000;
const localCatalogPath = join(process.cwd(), ".local-data", "mock-class-offers.csv");
const fixtureCatalogPath = join(process.cwd(), "src/content/fixtures/class-offers.csv");
const classIdPattern = /^[a-z0-9][a-z0-9-]{1,99}$/u;

async function readOfferInput(request: Request): Promise<{ input?: unknown; response?: Response }> {
  const parsed = await readJsonRequestBody(request, MAX_REQUEST_BYTES);
  if (parsed.response) return { response: parsed.response };
  const body = parsed.body;
  if (typeof body !== "object" || body === null || Array.isArray(body) || !("offer" in body)) {
    return { response: jsonResponse({ message: "수강 과목 정보를 확인해 주세요." }, 400) };
  }
  return { input: body.offer };
}

async function readClassId(context: { params: Promise<{ classId: string }> }): Promise<string> {
  const { classId } = await context.params;
  return classId;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ classId: string }> },
): Promise<Response> {
  const authorizationError = await checkAdminApiRequest(request, true);
  if (authorizationError) return authorizationError;

  const classId = await readClassId(context);
  if (!classIdPattern.test(classId)) return jsonResponse({ message: "수강 과목을 찾을 수 없습니다." }, 404);

  const parsedInput = await readOfferInput(request);
  if (parsedInput.response) return parsedInput.response;
  const parsedOffer = parseAdminMockClassOfferInput(parsedInput.input, classId);
  if (!parsedOffer.offer) {
    return jsonResponse({ message: "입력한 과목 정보를 확인해 주세요.", errors: parsedOffer.errors }, 422);
  }

  try {
    const useSupabase = hasSupabaseStorageConfiguration();
    const updated = useSupabase
      ? await updateSupabaseClassOffer(classId, parsedOffer.offer)
      : await updateMockClassOffer(localCatalogPath, fixtureCatalogPath, classId, parsedOffer.offer);
    return updated
      ? jsonResponse({ ok: true }, 200)
      : jsonResponse({ message: "수강 과목을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "과목 정보를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ classId: string }> },
): Promise<Response> {
  const authorizationError = await checkAdminApiRequest(request, false);
  if (authorizationError) return authorizationError;

  const classId = await readClassId(context);
  if (!classIdPattern.test(classId)) return jsonResponse({ message: "수강 과목을 찾을 수 없습니다." }, 404);

  try {
    const useSupabase = hasSupabaseStorageConfiguration();
    const deleted = useSupabase
      ? await deleteSupabaseClassOffer(classId)
      : await deleteMockClassOffer(localCatalogPath, fixtureCatalogPath, classId);
    return deleted
      ? jsonResponse({ ok: true }, 200)
      : jsonResponse({ message: "수강 과목을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "과목 정보를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
  }
}
