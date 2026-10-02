import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CLASS_OFFER_CSV_HEADERS, canApplyToMockOffer, groupMockClassOffersByCategoryAndStartDate, parseMockClassOffers, serializeMockClassOffersCsv, sortMockClassOffersByCategoryAndStartDate } from "../src/lib/mock-class-offers";
import { parseAdminMockClassOfferInput } from "../src/lib/admin-mock-class-offer-input";
import { validateMockEnrollment } from "../src/lib/mock-enrollment-form";

const fixtureCsv = readFileSync(join(process.cwd(), "src/content/fixtures/class-offers.csv"), "utf8");
const fixtureResult = parseMockClassOffers(fixtureCsv);
assert.deepEqual(fixtureResult.errors, [], "the checked-in mock catalog passes validation");
assert.equal(fixtureResult.offers.length, 4);
assert.ok(fixtureResult.offers.every((offer) => offer.isMock));
assert.deepEqual(parseMockClassOffers(serializeMockClassOffersCsv(fixtureResult.offers)).offers, fixtureResult.offers, "the catalog CSV serializer round-trips fixture data");

const shuffledOffers = [
  { ...fixtureResult.offers.find((offer) => offer.id === "demo-color-intro")!, startsAt: "2026-11-07T10:00:00+09:00" },
  { ...fixtureResult.offers.find((offer) => offer.id === "demo-cut-basics")!, id: "cut-later", startsAt: "2026-11-14T10:00:00+09:00" },
  { ...fixtureResult.offers.find((offer) => offer.id === "demo-consulting-closed")! },
  { ...fixtureResult.offers.find((offer) => offer.id === "demo-cut-basics")!, id: "cut-earlier", startsAt: "2026-10-10T10:00:00+09:00" },
  { ...fixtureResult.offers.find((offer) => offer.id === "demo-salon-work-ended")! },
];
assert.deepEqual(
  sortMockClassOffersByCategoryAndStartDate(shuffledOffers).map((offer) => offer.id),
  ["cut-earlier", "cut-later", "demo-color-intro", "demo-consulting-closed", "demo-salon-work-ended"],
  "offers sort by category order and then by ascending start date within a category",
);
assert.deepEqual(
  groupMockClassOffersByCategoryAndStartDate(shuffledOffers).map(({ category, offers }) => ({ category, ids: offers.map((offer) => offer.id) })),
  [
    { category: "CUT", ids: ["cut-earlier", "cut-later"] },
    { category: "COLOR", ids: ["demo-color-intro"] },
    { category: "CONSULTING", ids: ["demo-consulting-closed"] },
    { category: "SALON_WORK", ids: ["demo-salon-work-ended"] },
  ],
  "offers are returned in visual category groups, each containing start-date-sorted courses",
);

const now = new Date("2026-09-30T00:00:00+09:00");
const openOffer = fixtureResult.offers.find((offer) => offer.id === "demo-cut-basics");
assert.ok(openOffer);
const editableInput = {
  title: "테스트 새 과목",
  category: "PERM",
  instructorLabel: "가상 강사 (테스트)",
  summary: "첫 줄, \"인용\"\n둘째 줄",
  audience: "테스트용 대상자",
  startsAt: "2026-10-20T10:00",
  endsAt: "2026-10-20T13:00",
  location: "테스트 교육장 (가상)",
  tuitionKrw: "0",
  materials: "준비물 없음",
  recruitmentStatus: "open",
  applicationDeadline: "2026-10-19T23:59",
};
const editableOfferResult = parseAdminMockClassOfferInput(editableInput, "course-test-new");
assert.deepEqual(editableOfferResult.errors, [], "admin form values are validated and converted into a mock course");
assert.equal(editableOfferResult.offer?.startsAt, "2026-10-20T10:00:00+09:00", "admin date/time inputs are stored with an explicit Seoul offset");
assert.equal(editableOfferResult.offer?.isMock, true, "admin-created courses are always marked as mock data");
assert.deepEqual(parseMockClassOffers(serializeMockClassOffersCsv([editableOfferResult.offer!])).errors, [], "admin-created fields serialize safely with quotes and line breaks");
assert.ok(parseAdminMockClassOfferInput({ ...editableInput, category: "UNLISTED" }, "course-test-invalid").errors.length > 0, "unsupported categories are rejected");
assert.ok(parseAdminMockClassOfferInput({ ...editableInput, endsAt: "2026-10-20T09:59" }, "course-test-invalid").errors.length > 0, "end times before start times are rejected");
assert.equal(canApplyToMockOffer(openOffer, now), true);
assert.equal(canApplyToMockOffer(fixtureResult.offers.find((offer) => offer.id === "demo-color-intro")!, now), false, "upcoming courses cannot be selected");
assert.equal(canApplyToMockOffer(fixtureResult.offers.find((offer) => offer.id === "demo-consulting-closed")!, now), false, "closed courses cannot be selected");
assert.equal(canApplyToMockOffer(fixtureResult.offers.find((offer) => offer.id === "demo-salon-work-ended")!, now), false, "completed courses cannot be selected");
assert.equal(canApplyToMockOffer({ ...openOffer, applicationDeadline: "2026-09-29T23:59:00+09:00" }, now), false, "expired deadlines cannot be selected");
assert.equal(canApplyToMockOffer({ ...openOffer, applicationDeadline: "2026-09-30T00:00:00+09:00" }, now), false, "the exact deadline boundary is closed");
assert.equal(canApplyToMockOffer({ ...openOffer, startsAt: "2026-09-29T23:59:00+09:00" }, now), false, "courses that already started cannot be selected");
assert.equal(canApplyToMockOffer({ ...openOffer, startsAt: "2026-09-30T00:00:00+09:00" }, now), false, "a course starting at the current instant cannot be selected");

const validApplicant = { name: "테스트 수강생", phone: "010-1234-5678", salon: "", experience: "", inquiry: "" };
assert.deepEqual(validateMockEnrollment(validApplicant, openOffer, true, now), {}, "a valid mock application passes client-side validation");
assert.ok(validateMockEnrollment({ ...validApplicant, name: "x".repeat(41) }, openOffer, true, now).name, "applicant names over the limit are rejected");
assert.ok(validateMockEnrollment({ ...validApplicant, salon: "x".repeat(81) }, openOffer, true, now).salon, "salon values over the limit are rejected");
assert.ok(validateMockEnrollment({ ...validApplicant, experience: "x".repeat(61) }, openOffer, true, now).experience, "experience values over the limit are rejected");
assert.ok(validateMockEnrollment({ ...validApplicant, inquiry: "x".repeat(501) }, openOffer, true, now).inquiry, "inquiry values over the limit are rejected");
assert.deepEqual(
  validateMockEnrollment({ ...validApplicant, name: "A", phone: "010-123" }, openOffer, false, now),
  {
    name: "이름을 2자 이상 40자 이하로 입력해 주세요.",
    phone: "대한민국 휴대전화 번호를 확인해 주세요.",
    agreement: "테스트 입력 안내를 확인해 주세요.",
  },
  "name, phone, and test-only acknowledgment are validated together",
);
assert.equal(validateMockEnrollment(validApplicant, undefined, true, now).classId, "신청 가능한 과정을 먼저 선택해 주세요.");
assert.equal(
  validateMockEnrollment(validApplicant, fixtureResult.offers.find((offer) => offer.id === "demo-color-intro"), true, now).classId,
  "신청 가능한 과정을 먼저 선택해 주세요.",
  "unavailable courses cannot pass application validation even with otherwise valid fields",
);

const baseRow = [
  "test-class",
  "테스트 과정",
  "CUT",
  "가상 강사 (테스트)",
  "기본 소개",
  "테스트 대상자",
  "2026-10-17T10:00:00+09:00",
  "2026-10-17T13:00:00+09:00",
  "Asia/Seoul",
  "테스트 공간 (가상)",
  "100000",
  "테스트 도구",
  "open",
  "2026-10-10T23:59:00+09:00",
  "true",
];
const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
const toCsv = (row: readonly string[]) => `${CLASS_OFFER_CSV_HEADERS.join(",")}\r\n${row.map(csvCell).join(",")}`;

const quotedFields = [...baseRow];
quotedFields[4] = '쉼표, 따옴표 "지원"과\n줄바꿈이 포함된 소개';
const quotedResult = parseMockClassOffers(toCsv(quotedFields));
assert.deepEqual(quotedResult.errors, []);
assert.equal(quotedResult.offers[0]?.summary, quotedFields[4], "quoted commas, escaped quotes, and line breaks are preserved");

const wrongHeader = parseMockClassOffers(`${CLASS_OFFER_CSV_HEADERS.slice(1).join(",")}\n${baseRow.join(",")}`);
assert.equal(wrongHeader.offers.length, 0);
assert.ok(wrongHeader.errors.length > 0);

for (const [index, value] of [
  [2, "OTHER"],
  [6, "2026-10-17T10:00:00"],
  [8, "Invalid/Zone"],
  [10, "1.5"],
  [12, "accepting"],
  [14, "false"],
] as const) {
  const invalidRow = [...baseRow];
  invalidRow[index] = value;
  const result = parseMockClassOffers(toCsv(invalidRow));
  assert.equal(result.offers.length, 0, `invalid field at column ${index + 1} is excluded`);
  assert.ok(result.errors.length > 0);
}

const invalidEnd = [...baseRow];
invalidEnd[7] = "2026-10-17T09:00:00+09:00";
assert.equal(parseMockClassOffers(toCsv(invalidEnd)).offers.length, 0, "end time must follow start time");

const invalidCalendarDate = [...baseRow];
invalidCalendarDate[6] = "2026-02-31T10:00:00+09:00";
assert.equal(parseMockClassOffers(toCsv(invalidCalendarDate)).offers.length, 0, "calendar dates must be valid, not merely parseable");

const missingField = [...baseRow];
missingField[1] = " ";
assert.equal(parseMockClassOffers(toCsv(missingField)).offers.length, 0, "rows missing required data are excluded");

const duplicateRows = `${CLASS_OFFER_CSV_HEADERS.join(",")}\n${baseRow.join(",")}\n${baseRow.join(",")}`;
const duplicateResult = parseMockClassOffers(duplicateRows);
assert.equal(duplicateResult.offers.length, 0, "all rows sharing a duplicate ID are excluded");
assert.ok(duplicateResult.errors.some((error) => error.includes("중복 ID")));

assert.equal(parseMockClassOffers(`${CLASS_OFFER_CSV_HEADERS.join(",")}\n"unclosed`).offers.length, 0, "malformed quoted CSV is not exposed");

console.log("CSV mock 과정 테스트 통과: fixture·열 검증·인코딩·날짜·시간대·분야/시작일 정렬·금액·모집 상태·마감 경계·신청 필드·불가 과정 차단");
