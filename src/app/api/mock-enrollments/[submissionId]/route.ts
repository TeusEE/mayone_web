import { join } from "node:path";
import { isMockEnrollmentCsvStorageAvailable } from "@/content/mock-class-offers";
import { deleteMockEnrollmentCsv, updateMockEnrollmentCsv, type MockEnrollmentEditableValues } from "@/lib/mock-enrollment-csv";
import { isLocalAdminHost } from "@/lib/local-admin";
import { deleteSupabaseEnrollment, hasSupabaseStorageConfiguration, isSupabaseStorageConfigured, updateSupabaseEnrollment } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 4_000;
const fieldLimits = {
  name: 40,
  phone: 20,
  salon: 80,
  experience: 60,
  inquiry: 500,
} as const;

type EditableField = keyof typeof fieldLimits;

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function authorizeLocalMutation(request: Request, requiresJson: boolean): Response | null {
  if (!isMockEnrollmentCsvStorageAvailable() || !isLocalAdminHost(request.headers.get("host"))) {
    return jsonResponse({ message: "로컬 개발 서버에서만 사용할 수 있습니다." }, 404);
  }

  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin || requestOrigin !== new URL(request.url).origin) {
    return jsonResponse({ message: "요청 출처를 확인할 수 없습니다." }, 403);
  }

  if (requiresJson && !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ message: "JSON 형식으로 제출해 주세요." }, 415);
  }

  return null;
}

async function readEditableValues(request: Request): Promise<
  | { values: MockEnrollmentEditableValues; errors: Partial<Record<EditableField, string>> }
  | { response: Response }
> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { response: jsonResponse({ message: "수정 내용이 너무 큽니다." }, 413) };
  }

  let body: unknown;
  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_REQUEST_BYTES) {
      return { response: jsonResponse({ message: "수정 내용이 너무 큽니다." }, 413) };
    }
    body = JSON.parse(bodyText);
  } catch {
    return { response: jsonResponse({ message: "수정 내용을 읽을 수 없습니다." }, 400) };
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { response: jsonResponse({ message: "수정할 신청 정보를 확인해 주세요." }, 400) };
  }
  const input = (body as Record<string, unknown>).values;
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { response: jsonResponse({ message: "수정할 신청 정보를 확인해 주세요." }, 400) };
  }

  const raw = input as Record<string, unknown>;
  if ((Object.keys(fieldLimits) as EditableField[]).some((field) => typeof raw[field] !== "string")) {
    return { response: jsonResponse({ message: "수정할 신청 정보를 확인해 주세요." }, 400) };
  }

  const values: MockEnrollmentEditableValues = {
    name: (raw.name as string).trim(),
    phone: (raw.phone as string).trim().replace(/[^\d]/g, ""),
    salon: (raw.salon as string).trim(),
    experience: (raw.experience as string).trim(),
    inquiry: (raw.inquiry as string).trim(),
  };
  const errors: Partial<Record<EditableField, string>> = {};

  if (values.name.length < 2 || values.name.length > fieldLimits.name) {
    errors.name = "이름을 2자 이상 40자 이하로 입력해 주세요.";
  }
  if ((raw.phone as string).trim().length > fieldLimits.phone || !/^01[016789]\d{7,8}$/.test(values.phone)) {
    errors.phone = "대한민국 휴대전화 번호를 확인해 주세요.";
  }
  if (values.salon.length > fieldLimits.salon) errors.salon = "근무 매장은 80자 이하로 입력해 주세요.";
  if (values.experience.length > fieldLimits.experience) errors.experience = "경력은 60자 이하로 입력해 주세요.";
  if (values.inquiry.length > fieldLimits.inquiry) errors.inquiry = "문의사항은 500자 이하로 입력해 주세요.";

  return { values, errors };
}

function isSubmissionId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ submissionId: string }> },
): Promise<Response> {
  const authorizationError = authorizeLocalMutation(request, true);
  if (authorizationError) return authorizationError;

  const { submissionId } = await context.params;
  if (!isSubmissionId(submissionId)) return jsonResponse({ message: "신청 기록을 찾을 수 없습니다." }, 404);

  const parsed = await readEditableValues(request);
  if ("response" in parsed) return parsed.response;
  if (Object.keys(parsed.errors).length > 0) {
    return jsonResponse({ message: "입력 내용을 확인해 주세요.", errors: parsed.errors }, 422);
  }

  try {
    if (hasSupabaseStorageConfiguration() && !isSupabaseStorageConfigured()) {
      return jsonResponse({ message: "Supabase 환경변수를 확인해 주세요." }, 503);
    }
    const updated = isSupabaseStorageConfigured()
      ? await updateSupabaseEnrollment(submissionId, parsed.values)
      : await updateMockEnrollmentCsv(join(process.cwd(), ".local-data", "mock-enrollments.csv"), submissionId, parsed.values);
    return updated
      ? jsonResponse({ ok: true }, 200)
      : jsonResponse({ message: "신청 기록을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "테스트 신청 정보를 수정하지 못했습니다." }, 500);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ submissionId: string }> },
): Promise<Response> {
  const authorizationError = authorizeLocalMutation(request, false);
  if (authorizationError) return authorizationError;

  const { submissionId } = await context.params;
  if (!isSubmissionId(submissionId)) return jsonResponse({ message: "신청 기록을 찾을 수 없습니다." }, 404);

  try {
    if (hasSupabaseStorageConfiguration() && !isSupabaseStorageConfigured()) {
      return jsonResponse({ message: "Supabase 환경변수를 확인해 주세요." }, 503);
    }
    const deleted = isSupabaseStorageConfigured()
      ? await deleteSupabaseEnrollment(submissionId)
      : await deleteMockEnrollmentCsv(join(process.cwd(), ".local-data", "mock-enrollments.csv"), submissionId);
    return deleted
      ? jsonResponse({ ok: true }, 200)
      : jsonResponse({ message: "신청 기록을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "테스트 신청 정보를 삭제하지 못했습니다." }, 500);
  }
}
