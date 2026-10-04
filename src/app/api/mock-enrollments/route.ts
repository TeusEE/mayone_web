import { jsonResponse, readJsonRequestBody, checkSameOriginRequest } from "@/lib/http";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { getMockClassOffers, isMockEnrollmentAvailable, isMockEnrollmentCsvStorageAvailable } from "@/content/mock-class-offers";
import { appendMockEnrollmentCsv } from "@/lib/mock-enrollment-csv";
import { validateMockEnrollment, type MockEnrollmentErrors, type MockEnrollmentValues } from "@/lib/mock-enrollment-form";
import { createSupabaseEnrollment, hasSupabaseStorageConfiguration, isSupabaseStorageConfigured } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16_000;
const fieldLimits: Record<keyof MockEnrollmentValues, number> = {
  name: 40,
  phone: 20,
  salon: 80,
  experience: 60,
  inquiry: 500,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readValues(value: unknown): MockEnrollmentValues | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.name !== "string"
    || typeof value.phone !== "string"
    || typeof value.salon !== "string"
    || typeof value.experience !== "string"
    || typeof value.inquiry !== "string"
  ) return null;

  return {
    name: value.name.trim(),
    phone: value.phone.trim(),
    salon: value.salon.trim(),
    experience: value.experience.trim(),
    inquiry: value.inquiry.trim(),
  };
}

export async function POST(request: Request): Promise<Response> {
  if (!isMockEnrollmentAvailable()) {
    return jsonResponse({ message: "수강 신청 테스트가 비활성화되어 있습니다." }, 404);
  }
  if (!isMockEnrollmentCsvStorageAvailable() && !isSupabaseStorageConfigured()) {
    return jsonResponse({ message: "신청 저장소가 설정되지 않았습니다." }, 503);
  }
  if (hasSupabaseStorageConfiguration() && !isSupabaseStorageConfigured()) {
    return jsonResponse({ message: "Supabase 환경변수를 확인해 주세요." }, 503);
  }

  const originError = checkSameOriginRequest(request, true);
  if (originError) return originError;

  const parsed = await readJsonRequestBody(request, MAX_REQUEST_BYTES);
  if (parsed.response) return parsed.response;
  const rawBody = parsed.body;

  if (!isRecord(rawBody) || typeof rawBody.classId !== "string" || rawBody.classId.length > 100) {
    return jsonResponse({ message: "신청 과정을 확인해 주세요." }, 400);
  }

  const values = readValues(rawBody.values);
  if (!values || typeof rawBody.agreed !== "boolean") {
    return jsonResponse({ message: "입력 항목을 확인해 주세요." }, 400);
  }

  const errors: MockEnrollmentErrors = {};
  for (const [field, limit] of Object.entries(fieldLimits) as [keyof MockEnrollmentValues, number][]) {
    const rawValue = (rawBody.values as Record<string, string>)[field];
    if (rawValue.length > limit) errors[field] = `${limit}자 이하로 입력해 주세요.`;
  }

  try {
    const { offers } = await getMockClassOffers();
    const offer = offers.find((candidate) => candidate.id === rawBody.classId);
    Object.assign(errors, validateMockEnrollment(values, offer, rawBody.agreed));
    if (Object.keys(errors).length > 0) {
      return jsonResponse({ message: "입력 내용을 확인해 주세요.", errors }, 422);
    }

    const submissionId = randomUUID();
    const record = {
      submittedAt: new Date().toISOString(),
      submissionId,
      classId: offer!.id,
      classTitle: offer!.title,
      name: values.name,
      phone: values.phone.replace(/[^\d]/g, ""),
      salon: values.salon,
      experience: values.experience,
      inquiry: values.inquiry,
      testDataAcknowledged: rawBody.agreed,
    };
    if (isSupabaseStorageConfigured()) {
      const created = await createSupabaseEnrollment(record);
      if (!created) return jsonResponse({ message: "신청 기록을 저장하지 못했습니다. 다시 시도해 주세요." }, 409);
    } else {
      const filePath = join(process.cwd(), ".local-data", "mock-enrollments.csv");
      await appendMockEnrollmentCsv(filePath, record);
    }

    return jsonResponse({ ok: true, submissionId }, 201);
  } catch {
    return jsonResponse({ message: "테스트 데이터를 저장하지 못했습니다. 저장소 설정과 잠시 후 다시 시도해 주세요." }, 500);
  }
}
