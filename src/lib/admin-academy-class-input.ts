import { isValidExternalUrl } from "@/lib/actions";
import type { AcademyClass, ClassCategory, PublicationState, RecruitmentStatus } from "@/types/content";

export interface AdminAcademyClassInput {
  title: string;
  category: ClassCategory;
  publicationState: PublicationState;
  recruitmentStatus: RecruitmentStatus;
  instructorNamesText: string;
  instructorIdsText: string;
  introduction: string;
  audienceText: string;
  curriculumText: string;
  sessionsText: string;
  tuitionAmount: string;
  tuitionIncludesText: string;
  tuitionMaterialsText: string;
  cancellationPolicy: string;
  applicationUrl: string;
  deadlineAt: string;
}

const fields = Object.keys({
  title: true,
  category: true,
  publicationState: true,
  recruitmentStatus: true,
  instructorNamesText: true,
  instructorIdsText: true,
  introduction: true,
  audienceText: true,
  curriculumText: true,
  sessionsText: true,
  tuitionAmount: true,
  tuitionIncludesText: true,
  tuitionMaterialsText: true,
  cancellationPolicy: true,
  applicationUrl: true,
  deadlineAt: true,
}) as (keyof AdminAcademyClassInput)[];

const limits: Record<keyof AdminAcademyClassInput, number> = {
  title: 120,
  category: 20,
  publicationState: 20,
  recruitmentStatus: 20,
  instructorNamesText: 500,
  instructorIdsText: 500,
  introduction: 3000,
  audienceText: 1000,
  curriculumText: 3000,
  sessionsText: 6000,
  tuitionAmount: 16,
  tuitionIncludesText: 1000,
  tuitionMaterialsText: 1000,
  cancellationPolicy: 2000,
  applicationUrl: 500,
  deadlineAt: 16,
};

const categories = new Set<ClassCategory>(["CUT", "PERM", "COLOR", "CONSULTING", "SALON_WORK"]);
const publicationStates = new Set<PublicationState>(["draft", "published"]);
const recruitmentStatuses = new Set<RecruitmentStatus>(["upcoming", "open", "closed", "completed"]);
const idPattern = /^[a-z0-9][a-z0-9-]{1,99}$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textList(value: string): string[] {
  return value.split(/\r?\n/u).map((item) => item.trim()).filter(Boolean);
}

function idList(value: string): string[] {
  return value.split(/[\s,]+/u).map((item) => item.trim()).filter(Boolean);
}

function toSeoulIsoDateTime(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const [year, month, day, hour, minute] = [yearText, monthText, dayText, hourText, minuteText].map(Number);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59) return null;
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const normalized = `${value}:00+09:00`;
  return Number.isFinite(Date.parse(normalized)) ? normalized : null;
}

export function parseAdminAcademyClassInput(
  value: unknown,
  id: string,
  existing?: AcademyClass,
  now = new Date(),
): { item?: AcademyClass; errors: string[] } {
  if (!isRecord(value) || Object.keys(value).some((key) => !fields.includes(key as keyof AdminAcademyClassInput))) {
    return { errors: ["교육 과정 입력 형식이 올바르지 않습니다."] };
  }

  const errors: string[] = [];
  if (!idPattern.test(id)) errors.push("과정 ID 형식이 올바르지 않습니다.");
  const input = {} as Record<keyof AdminAcademyClassInput, string>;
  for (const field of fields) {
    const raw = value[field];
    if (typeof raw !== "string") {
      errors.push(`${field} 값은 문자열이어야 합니다.`);
      input[field] = "";
      continue;
    }
    input[field] = raw.trim();
    if (input[field].length > limits[field]) errors.push(`${field} 값은 ${limits[field]}자 이내로 입력해 주세요.`);
  }

  if (!categories.has(input.category as ClassCategory)) errors.push("교육 분야를 선택해 주세요.");
  if (!publicationStates.has(input.publicationState as PublicationState)) errors.push("공개 상태를 선택해 주세요.");
  if (!recruitmentStatuses.has(input.recruitmentStatus as RecruitmentStatus)) errors.push("모집 상태를 선택해 주세요.");

  const title = input.title;
  const instructorNames = textList(input.instructorNamesText);
  const instructorIds = idList(input.instructorIdsText);
  const audience = textList(input.audienceText);
  const curriculum = textList(input.curriculumText);
  const includes = textList(input.tuitionIncludesText);
  const materials = textList(input.tuitionMaterialsText);
  if (!title) errors.push("과정명을 입력해 주세요.");
  if (instructorNames.length > 20 || instructorNames.some((name) => name.length > 80)) errors.push("강사 이름은 80자 이내로 20명까지 입력해 주세요.");
  if (instructorIds.some((instructorId) => !idPattern.test(instructorId))) errors.push("강사 ID 형식을 확인해 주세요.");
  if (audience.length > 20 || audience.some((item) => item.length > 100)) errors.push("교육 대상은 항목별 100자 이내로 20개까지 입력해 주세요.");
  if (curriculum.length > 30 || curriculum.some((item) => item.length > 200)) errors.push("커리큘럼은 항목별 200자 이내로 30개까지 입력해 주세요.");
  if (includes.length > 20 || includes.some((item) => item.length > 100)) errors.push("포함 내역은 항목별 100자 이내로 20개까지 입력해 주세요.");
  if (materials.length > 20 || materials.some((item) => item.length > 100)) errors.push("준비물은 항목별 100자 이내로 20개까지 입력해 주세요.");

  const sessionLines = textList(input.sessionsText);
  if (sessionLines.length < 1 || sessionLines.length > 12) errors.push("회차는 1개 이상 12개 이하로 입력해 주세요.");
  const sessions = sessionLines.flatMap((line, index) => {
    const [startInput, endInput, ...locationParts] = line.split("|").map((part) => part.trim());
    const startsAt = toSeoulIsoDateTime(startInput ?? "");
    const endsAt = toSeoulIsoDateTime(endInput ?? "");
    const location = locationParts.join("|").trim();
    if (!startsAt || !endsAt || !location || location.length > 200) {
      errors.push(`회차 ${index + 1} 형식은 시작 시각 | 종료 시각 | 장소입니다.`);
      return [];
    }
    if (Date.parse(endsAt) <= Date.parse(startsAt)) {
      errors.push(`회차 ${index + 1}: 종료 시각은 시작 시각 이후여야 합니다.`);
      return [];
    }
    return [{ startsAt, endsAt, timeZone: "Asia/Seoul", location }];
  });

  if (!/^\d+$/u.test(input.tuitionAmount) || !Number.isSafeInteger(Number(input.tuitionAmount))) {
    errors.push("교육비는 0 이상의 정수로 입력해 주세요.");
  }
  const tuitionAmount = Number(input.tuitionAmount);
  const deadlineAt = input.deadlineAt ? toSeoulIsoDateTime(input.deadlineAt) : undefined;
  if (input.deadlineAt && !deadlineAt) errors.push("신청 마감 시각을 확인해 주세요.");
  if (input.applicationUrl && !isValidExternalUrl(input.applicationUrl)) errors.push("신청 URL은 사용자 정보가 없는 HTTPS 주소여야 합니다.");
  if (!input.introduction) errors.push("과정 소개를 입력해 주세요.");
  if (!input.cancellationPolicy) errors.push("취소 안내를 입력해 주세요.");

  const publicationState = publicationStates.has(input.publicationState as PublicationState)
    ? input.publicationState as PublicationState : "draft";
  const recruitmentStatus = recruitmentStatuses.has(input.recruitmentStatus as RecruitmentStatus)
    ? input.recruitmentStatus as RecruitmentStatus : "upcoming";
  if (publicationState === "published") {
    if (instructorIds.length === 0 && instructorNames.length === 0) errors.push("공개 과정에는 강사 이름 또는 등록된 강사 ID가 필요합니다.");
    if (audience.length === 0) errors.push("공개 과정에는 교육 대상이 필요합니다.");
    if (curriculum.length === 0) errors.push("공개 과정에는 커리큘럼이 필요합니다.");
    if (recruitmentStatus === "open" && !input.applicationUrl) errors.push("모집 중 과정에는 공식 신청 URL이 필요합니다.");
  }
  if (errors.length > 0) return { errors };

  const isPublished = publicationState === "published";
  const item: AcademyClass = {
    id,
    title,
    category: input.category as ClassCategory,
    publicationState,
    reviewState: isPublished ? "confirmed" : "pending",
    ...(isPublished ? { confirmedAt: existing?.confirmedAt ?? now.toISOString() } : {}),
    instructorIds,
    ...(instructorNames.length > 0 ? { instructorNames } : {}),
    introduction: input.introduction,
    audience,
    curriculum,
    sessions,
    tuition: { amount: tuitionAmount, currency: "KRW", includes, ...(materials.length > 0 ? { materials } : {}) },
    cancellationPolicy: input.cancellationPolicy,
    recruitmentStatus,
    ...(input.applicationUrl ? { applicationUrl: input.applicationUrl } : {}),
    ...(deadlineAt ? { deadlineAt } : {}),
    ...(existing?.image ? { image: existing.image } : {}),
  };
  return { item, errors: [] };
}

function toSeoulDateTimeInput(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function academyClassToAdminInput(item: AcademyClass): AdminAcademyClassInput {
  return {
    title: item.title,
    category: item.category,
    publicationState: item.publicationState,
    recruitmentStatus: item.recruitmentStatus,
    instructorNamesText: item.instructorNames?.join("\n") ?? "",
    instructorIdsText: item.instructorIds.join("\n"),
    introduction: item.introduction,
    audienceText: item.audience.join("\n"),
    curriculumText: item.curriculum.join("\n"),
    sessionsText: item.sessions.map((session) => `${toSeoulDateTimeInput(session.startsAt)} | ${toSeoulDateTimeInput(session.endsAt)} | ${session.location}`).join("\n"),
    tuitionAmount: String(item.tuition.amount),
    tuitionIncludesText: item.tuition.includes.join("\n"),
    tuitionMaterialsText: item.tuition.materials?.join("\n") ?? "",
    cancellationPolicy: item.cancellationPolicy,
    applicationUrl: item.applicationUrl ?? "",
    deadlineAt: item.deadlineAt ? toSeoulDateTimeInput(item.deadlineAt) : "",
  };
}
