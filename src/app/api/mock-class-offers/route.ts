import { jsonResponse, readJsonRequestBody } from "@/lib/http";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { checkAdminApiRequest } from "@/lib/admin-auth";
import { parseAdminMockClassOfferInput } from "@/lib/admin-mock-class-offer-input";
import { createMockClassOffer } from "@/lib/mock-class-offer-store";
import { createSupabaseClassOffer, hasSupabaseStorageConfiguration } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16_000;
const localCatalogPath = join(process.cwd(), ".local-data", "mock-class-offers.csv");
const fixtureCatalogPath = join(process.cwd(), "src/content/fixtures/class-offers.csv");

async function readOfferInput(request: Request): Promise<{ input?: unknown; response?: Response }> {
  const parsed = await readJsonRequestBody(request, MAX_REQUEST_BYTES);
  if (parsed.response) return { response: parsed.response };
  const body = parsed.body;
  if (typeof body !== "object" || body === null || Array.isArray(body) || !("offer" in body)) {
    return { response: jsonResponse({ message: "수강 과목 정보를 확인해 주세요." }, 400) };
  }
  return { input: body.offer };
}

export async function POST(request: Request): Promise<Response> {
  const authorizationError = await checkAdminApiRequest(request, true);
  if (authorizationError) return authorizationError;

  const parsedInput = await readOfferInput(request);
  if (parsedInput.response) return parsedInput.response;

  const classId = `course-${randomUUID()}`;
  const parsedOffer = parseAdminMockClassOfferInput(parsedInput.input, classId);
  if (!parsedOffer.offer) {
    return jsonResponse({ message: "입력한 과목 정보를 확인해 주세요.", errors: parsedOffer.errors }, 422);
  }

  try {
    if (hasSupabaseStorageConfiguration()) {
      const created = await createSupabaseClassOffer(parsedOffer.offer);
      return created
        ? jsonResponse({ ok: true, classId }, 201)
        : jsonResponse({ message: "같은 ID의 수강 과목이 이미 있습니다." }, 409);
    }

    const created = await createMockClassOffer(localCatalogPath, fixtureCatalogPath, parsedOffer.offer);
    return created
      ? jsonResponse({ ok: true, classId }, 201)
      : jsonResponse({ message: "같은 ID의 수강 과목이 이미 있습니다." }, 409);
  } catch {
    return jsonResponse({ message: "과목 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
  }
}
