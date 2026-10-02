import { join } from "node:path";
import { checkLocalAdminMutationRequest } from "@/lib/local-admin-mutation";
import { parseAdminMockClassOfferInput } from "@/lib/admin-mock-class-offer-input";
import { deleteMockClassOffer, updateMockClassOffer } from "@/lib/mock-class-offer-store";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16_000;
const localCatalogPath = join(process.cwd(), ".local-data", "mock-class-offers.csv");
const fixtureCatalogPath = join(process.cwd(), "src/content/fixtures/class-offers.csv");
const classIdPattern = /^[a-z0-9][a-z0-9-]{1,99}$/u;

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readOfferInput(request: Request): Promise<{ input?: unknown; response?: Response }> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { response: jsonResponse({ message: "수강 과목 정보가 너무 큽니다." }, 413) };
  }

  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_REQUEST_BYTES) {
      return { response: jsonResponse({ message: "수강 과목 정보가 너무 큽니다." }, 413) };
    }
    const body: unknown = JSON.parse(bodyText);
    if (typeof body !== "object" || body === null || Array.isArray(body) || !("offer" in body)) {
      return { response: jsonResponse({ message: "수강 과목 정보를 확인해 주세요." }, 400) };
    }
    return { input: body.offer };
  } catch {
    return { response: jsonResponse({ message: "수강 과목 정보를 읽지 못했습니다." }, 400) };
  }
}

async function readClassId(context: { params: Promise<{ classId: string }> }): Promise<string> {
  const { classId } = await context.params;
  return classId;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ classId: string }> },
): Promise<Response> {
  const authorizationError = checkLocalAdminMutationRequest(request, true);
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
    const updated = await updateMockClassOffer(localCatalogPath, fixtureCatalogPath, classId, parsedOffer.offer);
    return updated
      ? jsonResponse({ ok: true }, 200)
      : jsonResponse({ message: "수강 과목을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "로컬 과목 CSV를 수정하지 못했습니다. CSV 형식과 저장 경로를 확인해 주세요." }, 500);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ classId: string }> },
): Promise<Response> {
  const authorizationError = checkLocalAdminMutationRequest(request, false);
  if (authorizationError) return authorizationError;

  const classId = await readClassId(context);
  if (!classIdPattern.test(classId)) return jsonResponse({ message: "수강 과목을 찾을 수 없습니다." }, 404);

  try {
    const deleted = await deleteMockClassOffer(localCatalogPath, fixtureCatalogPath, classId);
    return deleted
      ? jsonResponse({ ok: true }, 200)
      : jsonResponse({ message: "수강 과목을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "로컬 과목 CSV를 삭제하지 못했습니다. CSV 형식과 저장 경로를 확인해 주세요." }, 500);
  }
}
