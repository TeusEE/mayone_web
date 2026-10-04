import { jsonResponse, readJsonRequestBody } from "@/lib/http";
import { join } from "node:path";
import { deleteMockEnrollmentCsv, updateMockEnrollmentCsv, type MockEnrollmentEditableValues } from "@/lib/mock-enrollment-csv";
import { checkAdminApiRequest } from "@/lib/admin-auth";
import { deleteSupabaseEnrollment, hasSupabaseStorageConfiguration, updateSupabaseEnrollment } from "@/lib/supabase-storage";

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

async function readEditableValues(request: Request): Promise<
  | { values: MockEnrollmentEditableValues; errors: Partial<Record<EditableField, string>> }
  | { response: Response }
> {
  const parsed = await readJsonRequestBody(request, MAX_REQUEST_BYTES);
  if (parsed.response) return { response: parsed.response };
  const body = parsed.body;

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
  const authorizationError = await checkAdminApiRequest(request, true);
  if (authorizationError) return authorizationError;

  const { submissionId } = await context.params;
  if (!isSubmissionId(submissionId)) return jsonResponse({ message: "신청 기록을 찾을 수 없습니다." }, 404);

  const parsed = await readEditableValues(request);
  if ("response" in parsed) return parsed.response;
  if (Object.keys(parsed.errors).length > 0) {
    return jsonResponse({ message: "입력 내용을 확인해 주세요.", errors: parsed.errors }, 422);
  }

  try {
    const updated = hasSupabaseStorageConfiguration()
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
  const authorizationError = await checkAdminApiRequest(request, false);
  if (authorizationError) return authorizationError;

  const { submissionId } = await context.params;
  if (!isSubmissionId(submissionId)) return jsonResponse({ message: "신청 기록을 찾을 수 없습니다." }, 404);

  try {
    const deleted = hasSupabaseStorageConfiguration()
      ? await deleteSupabaseEnrollment(submissionId)
      : await deleteMockEnrollmentCsv(join(process.cwd(), ".local-data", "mock-enrollments.csv"), submissionId);
    return deleted
      ? jsonResponse({ ok: true }, 200)
      : jsonResponse({ message: "신청 기록을 찾을 수 없습니다." }, 404);
  } catch {
    return jsonResponse({ message: "테스트 신청 정보를 삭제하지 못했습니다." }, 500);
  }
}
