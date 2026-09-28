import assert from "node:assert/strict";
import { branches } from "../src/content/branches";
import type { AcademyClass, Branch, ContentCollection, JobPosting } from "../src/types/content";
import { getBranchBookingAvailability, getClassApplicationAvailability, getJobApplicationAvailability, isValidExternalUrl } from "../src/lib/actions";
import { filterBranches, filterClasses, getBranchRegions } from "../src/lib/filters";
import { isValidImageSource } from "../src/lib/image";
import { getCollectionState, getPublicRecords } from "../src/lib/content-visibility";
import { createPageMetadata, getCanonicalSiteUrl, getRobotsMetadata, isIndexableDeployment } from "../src/lib/seo";

function branch(id: string, officialName: string, region: string, overrides: Partial<Branch> = {}): Branch {
  return {
    id,
    publicationState: "published",
    reviewState: "confirmed",
    officialName,
    region,
    address: "서울시 확인된 주소",
    operationState: "active",
    bookingUrl: "https://booking.example/salon",
    ...overrides,
  };
}

const session = {
  startsAt: "2026-10-01T01:00:00+09:00",
  endsAt: "2026-10-01T03:00:00+09:00",
  timeZone: "Asia/Seoul",
  location: "HARU 교육장",
};

function academyClass(overrides: Partial<AcademyClass> = {}): AcademyClass {
  return {
    id: "class-cut",
    publicationState: "published",
    reviewState: "confirmed",
    title: "기본 커트 교육",
    category: "CUT",
    instructorIds: ["instructor-1"],
    introduction: "커트 기본기를 연습합니다.",
    audience: ["미용인"],
    curriculum: ["기본 커트"],
    sessions: [session],
    tuition: { amount: 0, currency: "KRW", includes: [] },
    cancellationPolicy: "신청 페이지의 안내를 확인해 주세요.",
    recruitmentStatus: "open",
    applicationUrl: "https://forms.example/apply",
    deadlineAt: "2026-12-01T00:00:00+09:00",
    ...overrides,
  };
}

function jobPosting(overrides: Partial<JobPosting> = {}): JobPosting {
  return {
    id: "job-designer",
    publicationState: "published",
    reviewState: "confirmed",
    title: "헤어 디자이너",
    branchId: "branch-seoul",
    role: "디자이너",
    experience: "경력 확인 후 지원",
    duties: ["고객 상담과 시술"],
    qualifications: ["미용사 자격"],
    workingConditions: "면접 시 안내",
    salaryGuide: "경력에 따라 협의",
    process: ["서류", "면접"],
    requiredDocuments: ["이력서"],
    recruitmentStatus: "open",
    applicationUrl: "https://forms.example/job",
    deadlineAt: "2026-12-01T00:00:00+09:00",
    ...overrides,
  };
}

const now = new Date("2026-09-27T00:00:00Z");

const branchFixtures = [
  branch("branch-seoul", "메이원 강남점", "서울"),
  branch("branch-busan", "메이원 서면점", "부산"),
  branch("branch-seoul-2", "메이원 서울숲점", "서울"),
];
assert.deepEqual(getBranchRegions(branchFixtures), ["부산", "서울"]);
assert.deepEqual(filterBranches(branchFixtures, "강남", "서울").map((item) => item.id), ["branch-seoul"]);
assert.deepEqual(filterBranches(branchFixtures, "", "서울").map((item) => item.id), ["branch-seoul", "branch-seoul-2"]);
assert.deepEqual(filterBranches(branchFixtures, "", "").map((item) => item.id), branchFixtures.map((item) => item.id), "reset returns the unfiltered branch list");

const classFixtures = [
  academyClass({ id: "cut-open" }),
  academyClass({ id: "cut-closed", recruitmentStatus: "closed" }),
  academyClass({ id: "color-open", category: "COLOR" }),
];
assert.deepEqual(filterClasses(classFixtures, "CUT", "open").map((item) => item.id), ["cut-open"]);
assert.deepEqual(filterClasses(classFixtures, "COLOR", "closed"), []);
assert.deepEqual(filterClasses(classFixtures).map((item) => item.id), classFixtures.map((item) => item.id), "reset returns the unfiltered class list");

const draftCollection: ContentCollection<Branch> = {
  sourceState: "pending",
  records: [branch("branch-draft", "미공개 지점", "서울", { publicationState: "draft", reviewState: "pending" })],
};
const confirmedEmpty: ContentCollection<Branch> = { sourceState: "confirmed", records: [] };
const confirmedPublic: ContentCollection<Branch> = { sourceState: "confirmed", records: [branchFixtures[0]] };
assert.equal(getCollectionState(draftCollection), "preparing");
assert.deepEqual(getPublicRecords(draftCollection), []);
assert.equal(getCollectionState(confirmedEmpty), "empty");
assert.equal(getCollectionState(confirmedPublic), "available");

assert.equal(isValidExternalUrl("https://example.com/apply"), true);
assert.equal(isValidExternalUrl("http://example.com/apply"), false);
assert.equal(isValidExternalUrl("https://user:pass@example.com/apply"), false);
assert.equal(isValidImageSource("/images/official-salon.webp"), true);
assert.equal(isValidImageSource("//unapproved.example/image.jpg"), false);
assert.equal(isValidImageSource("/images/../private.jpg"), false);
assert.equal(isValidImageSource("http://example.com/image.jpg"), false);

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalVercelEnv = process.env.VERCEL_ENV;
process.env.NEXT_PUBLIC_SITE_URL = "https://www.example.com";
process.env.VERCEL_ENV = "production";
assert.equal(getCanonicalSiteUrl()?.origin, "https://www.example.com");
assert.equal(isIndexableDeployment(), true);
assert.deepEqual(getRobotsMetadata(true), { index: true, follow: true });
assert.deepEqual(getRobotsMetadata(false), { index: false, follow: true });
const publicMetadata = createPageMetadata({ title: "MAY.ONE", description: "공식 안내", path: "/", contentAvailable: true });
assert.deepEqual(publicMetadata.title, { absolute: "MAY.ONE" });
assert.deepEqual(publicMetadata.alternates, { canonical: "/" });
const unavailableMetadata = createPageMetadata({ title: "지점", description: "준비 중", path: "/salon", contentAvailable: false });
assert.equal(unavailableMetadata.alternates, undefined);
process.env.VERCEL_ENV = "preview";
assert.equal(isIndexableDeployment(), false);
assert.deepEqual(getRobotsMetadata(true), { index: false, follow: false });
process.env.VERCEL_ENV = "production";
process.env.NEXT_PUBLIC_SITE_URL = "http://www.example.com";
assert.equal(getCanonicalSiteUrl(), undefined);
assert.equal(isIndexableDeployment(), false);
if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
else process.env.VERCEL_ENV = originalVercelEnv;

assert.equal(getBranchBookingAvailability(branchFixtures[0]).enabled, true);
assert.equal(getBranchBookingAvailability(branch("branch-draft", "초안", "서울", { publicationState: "draft" })).reason, "not-public");
assert.equal(getBranchBookingAvailability(branch("branch-closed", "운영 종료", "서울", { operationState: "inactive" })).reason, "not-operational");
assert.equal(getBranchBookingAvailability(branch("branch-incomplete", "미완성", "", { address: "" })).reason, "incomplete");
assert.equal(getBranchBookingAvailability(branch("branch-no-url", "예약 없음", "서울", { bookingUrl: undefined })).reason, "missing-url");
assert.equal(getBranchBookingAvailability(branch("branch-bad-url", "잘못된 URL", "서울", { bookingUrl: "http://example.com" })).reason, "invalid-url");

for (const id of [
  "asan-tangjeong",
  "migeum",
  "western-dom",
  "yadang",
  "unjeong",
  "samsong",
  "haengdang",
  "yeongdeungpo-gu-office-mens",
]) {
  const publishedBranch = getPublicRecords(branches).find((item) => item.id === id);
  assert.ok(publishedBranch, `${id} is listed as a public branch`);
  assert.equal(getBranchBookingAvailability(publishedBranch).enabled, true, `${id} has an active branch reservation link`);
  assert.ok(publishedBranch.bookingUrl?.includes("pcmap.place.naver.com/hairshop/"), `${id} uses its Naver Place reservation link`);
}

assert.equal(getClassApplicationAvailability(academyClass(), now).enabled, true);
assert.equal(getClassApplicationAvailability(academyClass({ publicationState: "draft" }), now).reason, "not-public");
assert.equal(getClassApplicationAvailability(academyClass({ recruitmentStatus: "upcoming" }), now).reason, "not-open");
assert.equal(getClassApplicationAvailability(academyClass({ applicationUrl: undefined }), now).reason, "missing-url");
assert.equal(getClassApplicationAvailability(academyClass({ applicationUrl: "http://example.com" }), now).reason, "invalid-url");
assert.equal(getClassApplicationAvailability(academyClass({ audience: [] }), now).reason, "incomplete");
assert.equal(getClassApplicationAvailability(academyClass({ deadlineAt: now.toISOString() }), now).reason, "deadline-passed");
assert.equal(getClassApplicationAvailability(academyClass({ sessions: [{ ...session, startsAt: "2026-09-26T22:00:00Z", endsAt: "2026-09-26T23:00:00Z" }] }), now).reason, "not-open");

assert.equal(getJobApplicationAvailability(jobPosting(), now).enabled, true);
assert.equal(getJobApplicationAvailability(jobPosting({ reviewState: "pending" }), now).reason, "not-public");
assert.equal(getJobApplicationAvailability(jobPosting({ recruitmentStatus: "completed" }), now).reason, "not-open");
assert.equal(getJobApplicationAvailability(jobPosting({ applicationUrl: undefined }), now).reason, "missing-url");
assert.equal(getJobApplicationAvailability(jobPosting({ applicationUrl: "http://example.com" }), now).reason, "invalid-url");
assert.equal(getJobApplicationAvailability(jobPosting({ salaryGuide: "" }), now).reason, "incomplete");
assert.equal(getJobApplicationAvailability(jobPosting({ deadlineAt: now.toISOString() }), now).reason, "deadline-passed");

console.log("콘텐츠 규칙 테스트 통과: 공개 상태, 필터 조합/초기화, 이미지·외부 URL, 예약·신청·지원 CTA 마감 규칙");
