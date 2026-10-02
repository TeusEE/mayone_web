import type { ClassCategory, RecruitmentStatus } from "@/types/content";

export const CLASS_OFFER_CSV_HEADERS = [
  "id",
  "title",
  "category",
  "instructor_label",
  "summary",
  "audience",
  "starts_at",
  "ends_at",
  "time_zone",
  "location",
  "tuition_krw",
  "materials",
  "recruitment_status",
  "application_deadline",
  "is_mock",
] as const;

const categories = new Set<ClassCategory>(["CUT", "PERM", "COLOR", "CONSULTING", "SALON_WORK"]);
const recruitmentStatuses = new Set<RecruitmentStatus>(["upcoming", "open", "closed", "completed"]);

export interface MockClassOffer {
  id: string;
  title: string;
  category: ClassCategory;
  instructorLabel: string;
  summary: string;
  audience: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  location: string;
  tuitionKrw: number;
  materials: string;
  recruitmentStatus: RecruitmentStatus;
  applicationDeadline: string;
  isMock: true;
}

export interface MockClassOffersParseResult {
  offers: MockClassOffer[];
  errors: string[];
}

const classCategoryOrder: ClassCategory[] = ["CUT", "PERM", "COLOR", "CONSULTING", "SALON_WORK"];
const classCategoryOrderIndex = new Map(classCategoryOrder.map((category, index) => [category, index]));

export function sortMockClassOffersByCategoryAndStartDate(
  offers: readonly MockClassOffer[],
): MockClassOffer[] {
  return [...offers].sort((first, second) => {
    const categoryOrderDifference = classCategoryOrderIndex.get(first.category)! - classCategoryOrderIndex.get(second.category)!;
    if (categoryOrderDifference !== 0) return categoryOrderDifference;

    const startDateDifference = Date.parse(first.startsAt) - Date.parse(second.startsAt);
    if (startDateDifference !== 0) return startDateDifference;

    return first.id < second.id ? -1 : first.id > second.id ? 1 : 0;
  });
}

export interface MockClassOfferCategoryGroup {
  category: ClassCategory;
  offers: MockClassOffer[];
}

export function groupMockClassOffersByCategoryAndStartDate(
  offers: readonly MockClassOffer[],
): MockClassOfferCategoryGroup[] {
  const groups: MockClassOfferCategoryGroup[] = [];

  for (const offer of sortMockClassOffersByCategoryAndStartDate(offers)) {
    const currentGroup = groups.at(-1);
    if (currentGroup?.category === offer.category) {
      currentGroup.offers.push(offer);
    } else {
      groups.push({ category: offer.category, offers: [offer] });
    }
  }

  return groups;
}

function serializeCell(value: string): string {
  const safeValue = /^[\s]*[=+\-@]/u.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function serializeMockClassOffersCsv(offers: readonly MockClassOffer[]): string {
  const rows = offers.map((offer) => [
    offer.id,
    offer.title,
    offer.category,
    offer.instructorLabel,
    offer.summary,
    offer.audience,
    offer.startsAt,
    offer.endsAt,
    offer.timeZone,
    offer.location,
    String(offer.tuitionKrw),
    offer.materials,
    offer.recruitmentStatus,
    offer.applicationDeadline,
    String(offer.isMock),
  ].map(serializeCell).join(","));

  return `\uFEFF${CLASS_OFFER_CSV_HEADERS.join(",")}\r\n${rows.length ? `${rows.join("\r\n")}\r\n` : ""}`;
}

function parseCsvRows(csv: string): string[][] {
  const source = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let afterQuote = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (afterQuote) {
      if (character === ",") {
        row.push(field);
        field = "";
        afterQuote = false;
      } else if (character === "\n" || character === "\r") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        afterQuote = false;
        if (character === "\r" && source[index + 1] === "\n") index += 1;
      } else {
        throw new Error(`닫는 따옴표 뒤에 허용되지 않는 문자가 있습니다 (위치 ${index + 1}).`);
      }
      continue;
    }

    if (character === '"') {
      if (field.length > 0) throw new Error(`따옴표가 올바르게 열리지 않았습니다 (위치 ${index + 1}).`);
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (character === "\r" && source[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error("CSV의 따옴표가 닫히지 않았습니다.");
  if (afterQuote || field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value.trim() !== ""));
}

function hasExplicitIsoTimeZone(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  const offsetHour = Number(match[8] ?? "0");
  const offsetMinute = Number(match[9] ?? "0");
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (
    month < 1 || month > 12 || day < 1 || day > (daysInMonth ?? 0)
    || hour > 23 || minute > 59 || second > 59
    || offsetHour > 23 || offsetMinute > 59
  ) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() !== "Invalid Date";
}

function validTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("ko-KR", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function validateRow(values: string[], line: number): { offer?: MockClassOffer; errors: string[] } {
  const errors: string[] = [];
  if (values.length !== CLASS_OFFER_CSV_HEADERS.length) {
    return { errors: [`${line}행: 열 개수가 ${CLASS_OFFER_CSV_HEADERS.length}개가 아닙니다.`] };
  }

  const row = Object.fromEntries(CLASS_OFFER_CSV_HEADERS.map((header, index) => [header, values[index].trim()])) as Record<typeof CLASS_OFFER_CSV_HEADERS[number], string>;
  const requiredFields = CLASS_OFFER_CSV_HEADERS.filter((header) => header !== "materials");
  for (const field of requiredFields) {
    if (!row[field]) errors.push(`${line}행: ${field} 값이 비어 있습니다.`);
  }

  if (!categories.has(row.category as ClassCategory)) errors.push(`${line}행: category 값이 유효하지 않습니다.`);
  if (!recruitmentStatuses.has(row.recruitment_status as RecruitmentStatus)) errors.push(`${line}행: recruitment_status 값이 유효하지 않습니다.`);
  if (row.is_mock !== "true") errors.push(`${line}행: is_mock 값은 true여야 합니다.`);
  if (!/^\d+$/.test(row.tuition_krw) || !Number.isSafeInteger(Number(row.tuition_krw))) {
    errors.push(`${line}행: tuition_krw 값은 0 이상의 정수여야 합니다.`);
  }
  if (!hasExplicitIsoTimeZone(row.starts_at)) errors.push(`${line}행: starts_at 값에 유효한 시간대 오프셋이 필요합니다.`);
  if (!hasExplicitIsoTimeZone(row.ends_at)) errors.push(`${line}행: ends_at 값에 유효한 시간대 오프셋이 필요합니다.`);
  if (!hasExplicitIsoTimeZone(row.application_deadline)) errors.push(`${line}행: application_deadline 값에 유효한 시간대 오프셋이 필요합니다.`);
  if (hasExplicitIsoTimeZone(row.starts_at) && hasExplicitIsoTimeZone(row.ends_at) && Date.parse(row.ends_at) <= Date.parse(row.starts_at)) {
    errors.push(`${line}행: 종료 일시는 시작 일시 뒤여야 합니다.`);
  }
  if (!validTimeZone(row.time_zone)) errors.push(`${line}행: time_zone 값이 유효하지 않습니다.`);

  if (errors.length > 0) return { errors };
  return {
    errors,
    offer: {
      id: row.id,
      title: row.title,
      category: row.category as ClassCategory,
      instructorLabel: row.instructor_label,
      summary: row.summary,
      audience: row.audience,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      timeZone: row.time_zone,
      location: row.location,
      tuitionKrw: Number(row.tuition_krw),
      materials: row.materials,
      recruitmentStatus: row.recruitment_status as RecruitmentStatus,
      applicationDeadline: row.application_deadline,
      isMock: true,
    },
  };
}

export function parseMockClassOffers(csv: string): MockClassOffersParseResult {
  let rows: string[][];
  try {
    rows = parseCsvRows(csv);
  } catch (error) {
    return { offers: [], errors: [error instanceof Error ? error.message : "CSV를 읽을 수 없습니다."] };
  }

  if (rows.length === 0) return { offers: [], errors: ["CSV 파일에 헤더가 없습니다."] };
  const header = rows[0].map((value) => value.trim());
  if (header.length !== CLASS_OFFER_CSV_HEADERS.length || CLASS_OFFER_CSV_HEADERS.some((value, index) => header[index] !== value)) {
    return { offers: [], errors: ["CSV 헤더가 정해진 열 이름 또는 순서와 다릅니다."] };
  }

  const errors: string[] = [];
  const validated = rows.slice(1).map((values, index) => validateRow(values, index + 2));
  validated.forEach((result) => errors.push(...result.errors));

  const idRows = new Map<string, number[]>();
  for (let index = 0; index < rows.length - 1; index += 1) {
    const id = rows[index + 1][0]?.trim();
    if (id) idRows.set(id, [...(idRows.get(id) ?? []), index]);
  }
  const duplicateIndexes = new Set<number>();
  for (const [id, indexes] of idRows) {
    if (indexes.length > 1) {
      indexes.forEach((index) => duplicateIndexes.add(index));
      errors.push(`중복 ID를 가진 행은 노출하지 않습니다: ${id}.`);
    }
  }

  const offers = validated.flatMap((result, index) => result.offer && !duplicateIndexes.has(index) ? [result.offer] : []);
  return { offers, errors };
}

export function canApplyToMockOffer(offer: MockClassOffer, now = new Date()): boolean {
  const currentTime = now.getTime();
  return offer.isMock
    && offer.recruitmentStatus === "open"
    && Date.parse(offer.startsAt) > currentTime
    && Date.parse(offer.applicationDeadline) > currentTime;
}

export function getMockOfferDisplayStatus(offer: MockClassOffer, now = new Date()): RecruitmentStatus {
  if (offer.recruitmentStatus !== "open") return offer.recruitmentStatus;
  const currentTime = now.getTime();
  if (Date.parse(offer.endsAt) <= currentTime) return "completed";
  if (Date.parse(offer.applicationDeadline) <= currentTime || Date.parse(offer.startsAt) <= currentTime) return "closed";
  return "open";
}
