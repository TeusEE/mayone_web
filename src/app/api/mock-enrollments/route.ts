import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { getMockClassOffers, isMockEnrollmentAvailable, isMockEnrollmentCsvStorageAvailable } from "@/content/mock-class-offers";
import { appendMockEnrollmentCsv } from "@/lib/mock-enrollment-csv";
import { validateMockEnrollment, type MockEnrollmentErrors, type MockEnrollmentValues } from "@/lib/mock-enrollment-form";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16_000;
const fieldLimits: Record<keyof MockEnrollmentValues, number> = {
  name: 40,
  phone: 20,
  salon: 80,
  experience: 60,
  inquiry: 500,
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

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
  if (!isMockEnrollmentCsvStorageAvailable()) {
    return jsonResponse({ message: "CSV 저장은 로컬 개발 서버에서만 사용할 수 있습니다." }, 503);
  }

  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin || requestOrigin !== new URL(request.url).origin) {
    return jsonResponse({ message: "요청 출처를 확인할 수 없습니다." }, 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ message: "JSON 형식으로 제출해 주세요." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ message: "제출 내용이 너무 큽니다." }, 413);
  }

  let rawBody: unknown;
  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_REQUEST_BYTES) {
      return jsonResponse({ message: "제출 내용이 너무 큽니다." }, 413);
    }
    rawBody = JSON.parse(bodyText);
  } catch {
    return jsonResponse({ message: "제출 내용을 읽을 수 없습니다." }, 400);
  }

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
    const filePath = join(process.cwd(), ".local-data", "mock-enrollments.csv");
    await appendMockEnrollmentCsv(filePath, {
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
    });

    return jsonResponse({ ok: true, submissionId }, 201);
  } catch {
    return jsonResponse({ message: "테스트 데이터를 CSV 파일에 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
  }
}
