import {
  parseMockClassOffers,
  serializeMockClassOffersCsv,
  type MockClassOffer,
} from "@/lib/mock-class-offers";
import type { ClassCategory, RecruitmentStatus } from "@/types/content";

export const MOCK_CLASS_OFFER_INPUT_FIELDS = [
  "title",
  "category",
  "instructorLabel",
  "summary",
  "audience",
  "startsAt",
  "endsAt",
  "location",
  "tuitionKrw",
  "materials",
  "recruitmentStatus",
  "applicationDeadline",
] as const;

export type MockClassOfferInputField = typeof MOCK_CLASS_OFFER_INPUT_FIELDS[number];

const fieldLimits: Record<MockClassOfferInputField, number> = {
  title: 120,
  category: 20,
  instructorLabel: 80,
  summary: 1000,
  audience: 300,
  startsAt: 16,
  endsAt: 16,
  location: 200,
  tuitionKrw: 16,
  materials: 500,
  recruitmentStatus: 20,
  applicationDeadline: 16,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toSeoulIsoDateTime(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u.test(value)) return null;
  return `${value}:00+09:00`;
}

export function parseAdminMockClassOfferInput(
  value: unknown,
  id: string,
): { offer?: MockClassOffer; errors: string[] } {
  if (!isRecord(value) || Object.keys(value).some((key) => !(MOCK_CLASS_OFFER_INPUT_FIELDS as readonly string[]).includes(key))) {
    return { errors: ["수강 과목 입력 형식이 올바르지 않습니다."] };
  }

  const errors: string[] = [];
  for (const field of MOCK_CLASS_OFFER_INPUT_FIELDS) {
    if (typeof value[field] !== "string") {
      errors.push(`${field} 값은 문자열이어야 합니다.`);
      continue;
    }
    if ((value[field] as string).trim().length > fieldLimits[field]) {
      errors.push(`${field} 값이 허용 길이를 초과했습니다.`);
    }
  }
  if (errors.length > 0) return { errors };

  const input = Object.fromEntries(
    MOCK_CLASS_OFFER_INPUT_FIELDS.map((field) => [field, (value[field] as string).trim()]),
  ) as Record<MockClassOfferInputField, string>;
  const startsAt = toSeoulIsoDateTime(input.startsAt);
  const endsAt = toSeoulIsoDateTime(input.endsAt);
  const applicationDeadline = toSeoulIsoDateTime(input.applicationDeadline);
  if (!startsAt) errors.push("시작 일시를 확인해 주세요.");
  if (!endsAt) errors.push("종료 일시를 확인해 주세요.");
  if (!applicationDeadline) errors.push("신청 마감 일시를 확인해 주세요.");
  if (!/^\d+$/u.test(input.tuitionKrw) || !Number.isSafeInteger(Number(input.tuitionKrw))) {
    errors.push("교육비는 0 이상의 정수로 입력해 주세요.");
  }
  if (errors.length > 0) return { errors };

  const offer: MockClassOffer = {
    id,
    title: input.title,
    category: input.category as ClassCategory,
    instructorLabel: input.instructorLabel,
    summary: input.summary,
    audience: input.audience,
    startsAt: startsAt!,
    endsAt: endsAt!,
    timeZone: "Asia/Seoul",
    location: input.location,
    tuitionKrw: Number(input.tuitionKrw),
    materials: input.materials,
    recruitmentStatus: input.recruitmentStatus as RecruitmentStatus,
    applicationDeadline: applicationDeadline!,
    isMock: true,
  };
  const parsed = parseMockClassOffers(serializeMockClassOffersCsv([offer]));
  if (parsed.errors.length > 0 || parsed.offers.length !== 1) return { errors: parsed.errors };
  return { offer: parsed.offers[0], errors: [] };
}
