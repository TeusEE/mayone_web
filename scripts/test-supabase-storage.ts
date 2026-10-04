import assert from "node:assert/strict";
import {
  createSupabaseBranch,
  createSupabaseClassOffer,
  createSupabaseEnrollment,
  deleteSupabaseBranch,
  deleteSupabaseClassOffer,
  deleteSupabaseEnrollment,
  getSupabaseDataTarget,
  hasSupabaseStorageConfiguration,
  getSupabaseBranches,
  getSupabaseClassOffers,
  getSupabaseEnrollments,
  isSupabaseStorageConfigured,
  supabaseStorageConfigurationMessage,
  updateSupabaseBranch,
  updateSupabaseClassOffer,
  updateSupabaseEnrollment,
} from "../src/lib/supabase-storage";
import { getAdminBranchCatalog, getSalonDirectoryData } from "../src/content/local-branches";
import { getMockClassOffers } from "../src/content/mock-class-offers";
import { getMockEnrollmentStorageTarget } from "../src/content/mock-enrollments";
import type { Branch } from "../src/types/content";
import type { MockClassOffer } from "../src/lib/mock-class-offers";
import type { MockEnrollmentCsvRecord } from "../src/lib/mock-enrollment-csv";

process.env.SUPABASE_URL = "https://unit-test.supabase.co";
process.env.SUPABASE_SECRET_KEY = "sb_secret_unit_test_only";
process.env.SUPABASE_DATA_TARGET = "test";
delete process.env.VERCEL_ENV;

type TableName = "mayone_branches" | "mayone_class_offers" | "mayone_enrollments";
type Row = { id: string; data: Record<string, unknown> };
const database: Record<TableName, Row[]> = {
  mayone_branches: [],
  mayone_class_offers: [],
  mayone_enrollments: [],
};

function eqValue(url: URL): string | undefined {
  const value = url.searchParams.get("id");
  return value?.startsWith("eq.") ? value.slice(3) : undefined;
}

function respond(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  const table = url.pathname.split("/").at(-1) as TableName;
  const rows = database[table];
  const method = init?.method ?? "GET";
  const id = eqValue(url);
  const headers = new Headers(init?.headers);
  assert.equal(headers.get("apikey"), process.env.SUPABASE_SECRET_KEY);

  if (method === "GET") {
    if (id) return respond(rows.filter((row) => row.id === id));
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 1000);
    return respond(rows.slice(offset, offset + limit));
  }
  if (method === "POST") {
    const parsed = JSON.parse(String(init?.body)) as Row | Row[];
    const incoming = Array.isArray(parsed) ? parsed : [parsed];
    if (incoming.some((record) => rows.some((row) => row.id === record.id))) {
      return respond({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
    }
    rows.push(...incoming);
    return respond(headers.get("Prefer")?.includes("return=representation") ? incoming.map((row) => ({ id: row.id })) : null, 201);
  }
  if (method === "PATCH") {
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return respond([], 200);
    const body = JSON.parse(String(init?.body)) as { data: Record<string, unknown> };
    rows[index] = { ...rows[index], data: body.data };
    return respond([{ id }]);
  }
  if (method === "DELETE") {
    const removed = rows.filter((row) => row.id === id);
    database[table] = rows.filter((row) => row.id !== id);
    return respond(removed.map((row) => ({ id: row.id })));
  }
  return respond({ message: `Unexpected method ${method}` }, 405);
};

const branch: Branch = {
  id: "test-branch",
  publicationState: "draft",
  reviewState: "pending",
  officialName: "테스트 지점",
  operationState: "unknown",
};

const offer: MockClassOffer = {
  id: "test-course",
  title: "테스트 커트 과정",
  category: "CUT",
  instructorLabel: "테스트 강사",
  summary: "과정 저장 테스트",
  audience: "디자이너",
  startsAt: "2099-04-01T10:00:00+09:00",
  endsAt: "2099-04-01T12:00:00+09:00",
  timeZone: "Asia/Seoul",
  location: "서울",
  tuitionKrw: 1000,
  materials: "",
  recruitmentStatus: "open",
  applicationDeadline: "2099-03-01T10:00:00+09:00",
  isMock: true,
};

const enrollment: MockEnrollmentCsvRecord = {
  submittedAt: "2026-10-02T03:00:00.000Z",
  submissionId: "9e2cd7fb-9e19-4c45-87f5-024044907fe8",
  classId: offer.id,
  classTitle: offer.title,
  name: "테스트 신청자",
  phone: "01012345678",
  salon: "테스트 살롱",
  experience: "3년",
  inquiry: "저장소 테스트",
  testDataAcknowledged: true,
};

async function main(): Promise<void> {
  assert.equal(isSupabaseStorageConfigured(), true);
  assert.equal(getSupabaseDataTarget(), "test");
  process.env.SUPABASE_DATA_TARGET = "production";
  assert.equal(isSupabaseStorageConfigured(), false);
  assert.match(supabaseStorageConfigurationMessage() ?? "", /SUPABASE_DATA_TARGET=test/u);
  process.env.VERCEL_ENV = "production";
  assert.equal(isSupabaseStorageConfigured(), true);
  assert.equal(getSupabaseDataTarget(), "production");
  process.env.SUPABASE_DATA_TARGET = "test";
  assert.equal(isSupabaseStorageConfigured(), false);
  assert.match(supabaseStorageConfigurationMessage() ?? "", /SUPABASE_DATA_TARGET=production/u);
  process.env.SUPABASE_DATA_TARGET = "production";

  assert.equal(await createSupabaseBranch(branch), true);
  assert.deepEqual(await getSupabaseBranches(), [branch]);
  assert.deepEqual(await getAdminBranchCatalog(), [branch], "remote branch reads also work outside development");
  assert.equal(await createSupabaseBranch(branch), false);
  const updatedBranch = { ...branch, officialName: "수정 테스트 지점" };
  assert.equal(await updateSupabaseBranch(branch.id, updatedBranch), true);
  assert.equal((await getSupabaseBranches())[0].officialName, updatedBranch.officialName);
  assert.equal(await deleteSupabaseBranch(branch.id), true);
  assert.equal(await deleteSupabaseBranch(branch.id), false);

  const publicBranch = {
    ...branch, publicationState: "published" as const, reviewState: "confirmed" as const,
    confirmedAt: "2026-10-04T00:00:00Z", region: "서울", address: "테스트 주소",
    operationState: "active" as const, placeUrl: "https://example.com/internal-reference", internalNote: "private",
  };
  assert.equal(await createSupabaseBranch(publicBranch), true);
  const directory = await getSalonDirectoryData();
  assert.equal(directory.branches.length, 1);
  assert.equal("placeUrl" in directory.branches[0], false);
  assert.equal("internalNote" in directory.branches[0], false);
  await deleteSupabaseBranch(branch.id);
  assert.deepEqual(await getMockClassOffers(), { offers: [], errors: [] }, "production does not read mock catalogs");

  assert.equal(await createSupabaseClassOffer(offer), true);
  assert.deepEqual(await getSupabaseClassOffers(), [offer]);
  const updatedOffer = { ...offer, title: "=수정 테스트 과정" };
  assert.equal(await updateSupabaseClassOffer(offer.id, updatedOffer), true);
  assert.equal((await getSupabaseClassOffers())[0].title, updatedOffer.title);
  assert.equal(await deleteSupabaseClassOffer(offer.id), true);

  assert.equal(await createSupabaseEnrollment(enrollment), true);
  assert.deepEqual(await getSupabaseEnrollments(), [enrollment]);
  const editedValues = { ...enrollment, name: "수정 신청자", inquiry: "=관리자 문의" };
  assert.equal(await updateSupabaseEnrollment(enrollment.submissionId, editedValues), true);
  assert.equal((await getSupabaseEnrollments())[0].name, editedValues.name);
  assert.equal((await getSupabaseEnrollments())[0].inquiry, editedValues.inquiry, "DB reads preserve formula-like text without export escaping");
  assert.equal(await deleteSupabaseEnrollment(enrollment.submissionId), true);
  assert.equal(await deleteSupabaseEnrollment(enrollment.submissionId), false);

  database.mayone_enrollments = Array.from({ length: 1001 }, (_, index) => ({
    id: `record-${index}`, data: { ...enrollment, submissionId: `record-${index}` },
  }));
  assert.equal((await getSupabaseEnrollments()).length, 1001, "reads continue past the PostgREST page limit");

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://auth-only.supabase.co";
  assert.equal(hasSupabaseStorageConfiguration(), false, "Auth URL alone does not configure storage");
  process.env.SUPABASE_URL = "https://unit-test.supabase.co";
  assert.equal(getMockEnrollmentStorageTarget(), "unavailable", "invalid storage settings never advertise local submission");

  globalThis.fetch = originalFetch;
  console.log("Supabase storage CRUD and row parsing tests passed.");
}

main().catch((error: unknown) => {
  globalThis.fetch = originalFetch;
  console.error(error);
  process.exitCode = 1;
});
