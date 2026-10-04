import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseLocalBranchCatalog } from "@/lib/local-branch-store";
import {
  parseMockClassOffers,
  serializeMockClassOffersCsv,
  type MockClassOffer,
} from "@/lib/mock-class-offers";
import {
  MOCK_ENROLLMENT_CSV_HEADERS,
  parseMockEnrollmentCsv,
  serializeMockEnrollmentCsvRow,
  type MockEnrollmentCsvRecord,
  type MockEnrollmentEditableValues,
} from "@/lib/mock-enrollment-csv";
import type { AcademyClass, Branch } from "@/types/content";
import type { Database } from "@/types/supabase";

type ManagedTable = "mayone_branches" | "mayone_class_offers" | "mayone_enrollments";
type ManagedRecord = { id: string; data: unknown };
export type SupabaseDataTarget = "test" | "production";

const TABLES = {
  branches: "mayone_branches",
  classOffers: "mayone_class_offers",
  enrollments: "mayone_enrollments",
} as const satisfies Record<string, ManagedTable>;

function getSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
}

function getSupabaseSecretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || undefined;
}

function getExpectedSupabaseDataTarget(): SupabaseDataTarget {
  return process.env.VERCEL_ENV === "production" ? "production" : "test";
}

export function getSupabaseDataTarget(): SupabaseDataTarget | null {
  const target = process.env.SUPABASE_DATA_TARGET?.trim();
  return target === "test" || target === "production" ? target : null;
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(
    getSupabaseUrl()
    && getSupabaseSecretKey()
    && getSupabaseDataTarget() === getExpectedSupabaseDataTarget(),
  );
}

export function hasSupabaseStorageConfiguration(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() || getSupabaseSecretKey());
}

export function supabaseStorageConfigurationMessage(): string | null {
  if (!hasSupabaseStorageConfiguration()) return null;
  if (!getSupabaseUrl()) return "SUPABASE_URL이 설정되지 않았습니다.";
  if (!getSupabaseSecretKey()) return "SUPABASE_SECRET_KEY가 설정되지 않았습니다.";
  const target = getSupabaseDataTarget();
  if (!target) return "SUPABASE_DATA_TARGET을 test 또는 production으로 설정해 주세요.";
  const expectedTarget = getExpectedSupabaseDataTarget();
  if (target !== expectedTarget) {
    return `현재 배포 환경에서는 SUPABASE_DATA_TARGET=${expectedTarget}만 사용할 수 있습니다.`;
  }
  return null;
}

function getSupabaseClient(): SupabaseClient<Database> {
  const url = getSupabaseUrl();
  const secretKey = getSupabaseSecretKey();
  const configurationMessage = supabaseStorageConfigurationMessage();
  if (!url || !secretKey || configurationMessage) {
    throw new Error(configurationMessage ?? "Supabase 환경변수를 설정해 주세요.");
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeRecords<T>(rows: readonly ManagedRecord[], idField: "id" | "submissionId"): T[] {
  return rows.map((row) => {
    if (!isRecord(row.data) || typeof row.data[idField] !== "string" || row.data[idField] !== row.id) {
      throw new Error("Supabase 저장 데이터의 ID 또는 형식이 올바르지 않습니다.");
    }
    return row.data as T;
  });
}

async function selectRecords(table: ManagedTable): Promise<ManagedRecord[]> {
  const client = getSupabaseClient();
  const records: ManagedRecord[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from(table).select("id,data")
      .order("id", { ascending: true }).range(offset, offset + pageSize - 1);
    if (error) throw new Error(`Supabase ${table} 조회에 실패했습니다: ${error.message}`);
    const page = (data ?? []) as ManagedRecord[];
    records.push(...page);
    if (page.length < pageSize) return records;
  }
}

async function selectRecord(table: ManagedTable, id: string): Promise<ManagedRecord | null> {
  const { data, error } = await getSupabaseClient().from(table).select("id,data").eq("id", id).maybeSingle();
  if (error) throw new Error(`Supabase ${table} 조회에 실패했습니다: ${error.message}`);
  return data as ManagedRecord | null;
}

async function insertRecord(table: ManagedTable, record: { id: string }): Promise<boolean> {
  const { data, error } = await getSupabaseClient()
    .from(table)
    .insert({ id: record.id, data: record as never })
    .select("id")
    .maybeSingle();
  if (error?.code === "23505") return false;
  if (error) throw new Error(`Supabase ${table} 저장에 실패했습니다: ${error.message}`);
  return Boolean(data);
}

async function updateRecord(table: ManagedTable, id: string, record: { id: string }): Promise<boolean> {
  const { data, error } = await getSupabaseClient()
    .from(table)
    .update({ data: record as never, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) throw new Error(`Supabase ${table} 수정에 실패했습니다: ${error.message}`);
  return Boolean(data?.length);
}

async function deleteRecord(table: ManagedTable, id: string): Promise<boolean> {
  const { data, error } = await getSupabaseClient().from(table).delete().eq("id", id).select("id");
  if (error) throw new Error(`Supabase ${table} 삭제에 실패했습니다: ${error.message}`);
  return Boolean(data?.length);
}

export async function upsertSupabaseRecords<T extends { id: string }>(table: ManagedTable, records: readonly T[]): Promise<void> {
  if (records.length === 0) return;
  const rows = records.map((record) => ({ id: record.id, data: record as never }));
  const { error } = await getSupabaseClient().from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Supabase ${table} 가져오기에 실패했습니다: ${error.message}`);
}

export async function getSupabaseBranches(): Promise<Branch[]> {
  const rows = decodeRecords<Branch>(await selectRecords(TABLES.branches), "id");
  return parseLocalBranchCatalog(JSON.stringify({ version: 1, branches: rows }));
}

export async function isSupabaseAdminEmailAllowed(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;
  const { data, error } = await getSupabaseClient()
    .from("mayone_admin_emails")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (error) throw new Error(`Supabase 관리자 허용 목록 조회에 실패했습니다: ${error.message}`);
  return Boolean(data);
}

export async function createAuthenticatedSupabaseBranch(branch: Branch): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(TABLES.branches)
    .insert({ id: branch.id, data: branch as never })
    .select("id")
    .maybeSingle();
  if (error?.code === "23505") return false;
  if (error) throw new Error(`Supabase 지점 저장에 실패했습니다: ${error.message}`);
  return Boolean(data);
}

export async function updateAuthenticatedSupabaseBranch(branchId: string, branch: Branch): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(TABLES.branches)
    .update({ data: { ...branch, id: branchId } as never, updated_at: new Date().toISOString() })
    .eq("id", branchId)
    .select("id");
  if (error) throw new Error(`Supabase 지점 수정에 실패했습니다: ${error.message}`);
  return Boolean(data?.length);
}

export async function createSupabaseBranch(branch: Branch): Promise<boolean> {
  return insertRecord(TABLES.branches, branch);
}

export async function updateSupabaseBranch(branchId: string, branch: Branch): Promise<boolean> {
  return updateRecord(TABLES.branches, branchId, { ...branch, id: branchId });
}

export async function deleteSupabaseBranch(branchId: string): Promise<boolean> {
  return deleteRecord(TABLES.branches, branchId);
}

export async function getSupabaseClassOffers(): Promise<MockClassOffer[]> {
  const offers = decodeRecords<MockClassOffer>(await selectRecords(TABLES.classOffers), "id");
  if (offers.some((offer) => typeof offer.tuitionKrw !== "number" || offer.isMock !== true)) {
    throw new Error("Supabase 테스트 과목의 금액 또는 mock 표시를 확인해 주세요.");
  }
  const csv = serializeMockClassOffersCsv(offers);
  const result = parseMockClassOffers(csv);
  if (result.errors.length > 0 || result.offers.length !== offers.length) {
    throw new Error(`Supabase 과목 자료를 확인해 주세요: ${result.errors.join(" ")}`);
  }
  // CSV validation must not apply export-only formula escaping to database values.
  return offers;
}

export async function createSupabaseClassOffer(offer: MockClassOffer): Promise<boolean> {
  return insertRecord(TABLES.classOffers, offer);
}

export async function updateSupabaseClassOffer(classId: string, offer: MockClassOffer): Promise<boolean> {
  return updateRecord(TABLES.classOffers, classId, { ...offer, id: classId });
}

export async function deleteSupabaseClassOffer(classId: string): Promise<boolean> {
  return deleteRecord(TABLES.classOffers, classId);
}

function isAcademyClassRecord(value: unknown, rowId: string): value is AcademyClass {
  if (!isRecord(value) || value.id !== rowId) return false;
  if (typeof value.title !== "string" || typeof value.introduction !== "string" || typeof value.cancellationPolicy !== "string") return false;
  if (!(["CUT", "PERM", "COLOR", "CONSULTING", "SALON_WORK"] as unknown[]).includes(value.category)) return false;
  if (!(["draft", "published"] as unknown[]).includes(value.publicationState)
    || !(["pending", "confirmed"] as unknown[]).includes(value.reviewState)) return false;
  if (!(["upcoming", "open", "closed", "completed"] as unknown[]).includes(value.recruitmentStatus)) return false;
  const isStringArray = (input: unknown) => Array.isArray(input) && input.every((item) => typeof item === "string");
  if (!isStringArray(value.instructorIds) || (value.instructorNames !== undefined && !isStringArray(value.instructorNames))) return false;
  if (!isStringArray(value.audience) || !isStringArray(value.curriculum)) return false;
  if (!Array.isArray(value.sessions) || value.sessions.some((session) => !isRecord(session)
    || typeof session.startsAt !== "string" || typeof session.endsAt !== "string"
    || !Number.isFinite(Date.parse(session.startsAt)) || !Number.isFinite(Date.parse(session.endsAt))
    || Date.parse(session.endsAt) <= Date.parse(session.startsAt)
    || typeof session.timeZone !== "string" || typeof session.location !== "string")) return false;
  if (!isRecord(value.tuition) || typeof value.tuition.amount !== "number" || !Number.isFinite(value.tuition.amount)
    || value.tuition.currency !== "KRW" || !isStringArray(value.tuition.includes)
    || (value.tuition.materials !== undefined && !isStringArray(value.tuition.materials))) return false;
  if (value.confirmedAt !== undefined && (typeof value.confirmedAt !== "string" || !Number.isFinite(Date.parse(value.confirmedAt)))) return false;
  if (value.deadlineAt !== undefined && (typeof value.deadlineAt !== "string" || !Number.isFinite(Date.parse(value.deadlineAt)))) return false;
  if (value.applicationUrl !== undefined && typeof value.applicationUrl !== "string") return false;
  if (value.image !== undefined && (!isRecord(value.image) || typeof value.image.src !== "string" || typeof value.image.alt !== "string"
    || (value.image.width !== undefined && typeof value.image.width !== "number")
    || (value.image.height !== undefined && typeof value.image.height !== "number"))) return false;
  return true;
}

function projectAcademyClass(item: AcademyClass): AcademyClass {
  const image = item.image;
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    publicationState: item.publicationState,
    reviewState: item.reviewState,
    ...(item.confirmedAt ? { confirmedAt: item.confirmedAt } : {}),
    instructorIds: [...item.instructorIds],
    ...(item.instructorNames ? { instructorNames: [...item.instructorNames] } : {}),
    introduction: item.introduction,
    audience: [...item.audience],
    curriculum: [...item.curriculum],
    sessions: item.sessions.map((session) => ({
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      timeZone: session.timeZone,
      location: session.location,
    })),
    tuition: {
      amount: item.tuition.amount,
      currency: "KRW",
      includes: [...item.tuition.includes],
      ...(item.tuition.materials ? { materials: [...item.tuition.materials] } : {}),
    },
    cancellationPolicy: item.cancellationPolicy,
    recruitmentStatus: item.recruitmentStatus,
    ...(item.applicationUrl ? { applicationUrl: item.applicationUrl } : {}),
    ...(item.deadlineAt ? { deadlineAt: item.deadlineAt } : {}),
    ...(image ? {
      image: {
        src: image.src,
        alt: image.alt,
        ...(image.width ? { width: image.width } : {}),
        ...(image.height ? { height: image.height } : {}),
      },
    } : {}),
  };
}

export async function getSupabaseAcademyClasses(): Promise<AcademyClass[]> {
  const rows = await selectRecords(TABLES.classOffers);
  const result: AcademyClass[] = [];
  for (const row of rows) {
    if (isAcademyClassRecord(row.data, row.id)) result.push(projectAcademyClass(row.data));
  }
  return result;
}

export async function getSupabasePublicAcademyClasses(): Promise<AcademyClass[]> {
  return (await getSupabaseAcademyClasses()).filter((item) =>
    item.publicationState === "published" && item.reviewState === "confirmed" && Boolean(item.confirmedAt),
  );
}

export async function createAuthenticatedSupabaseAcademyClass(item: AcademyClass): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(TABLES.classOffers)
    .insert({ id: item.id, data: item as never })
    .select("id")
    .maybeSingle();
  if (error?.code === "23505") return false;
  if (error) throw new Error(`Supabase 과정 저장에 실패했습니다: ${error.message}`);
  return Boolean(data);
}

export async function createSupabaseAcademyClass(item: AcademyClass): Promise<boolean> {
  return insertRecord(TABLES.classOffers, item);
}

export async function updateAuthenticatedSupabaseAcademyClass(classId: string, item: AcademyClass): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(TABLES.classOffers)
    .update({ data: { ...item, id: classId } as never, updated_at: new Date().toISOString() })
    .eq("id", classId)
    .select("id");
  if (error) throw new Error(`Supabase 과정 수정에 실패했습니다: ${error.message}`);
  return Boolean(data?.length);
}

export async function updateSupabaseAcademyClass(classId: string, item: AcademyClass): Promise<boolean> {
  return updateRecord(TABLES.classOffers, classId, { ...item, id: classId });
}

export async function getSupabaseEnrollments(): Promise<MockEnrollmentCsvRecord[]> {
  const records = decodeRecords<MockEnrollmentCsvRecord>(await selectRecords(TABLES.enrollments), "submissionId");
  if (records.some((record) => typeof record.testDataAcknowledged !== "boolean")) {
    throw new Error("Supabase 신청 데이터의 테스트 확인 항목을 확인해 주세요.");
  }
  const csv = [MOCK_ENROLLMENT_CSV_HEADERS.join(","), ...records.map(serializeMockEnrollmentCsvRow)].join("\n");
  parseMockEnrollmentCsv(csv);
  return records.map((record) => ({
    submittedAt: record.submittedAt,
    submissionId: record.submissionId,
    classId: record.classId,
    classTitle: record.classTitle,
    name: record.name,
    phone: record.phone,
    salon: record.salon,
    experience: record.experience,
    inquiry: record.inquiry,
    testDataAcknowledged: record.testDataAcknowledged,
  }));
}

export async function createSupabaseEnrollment(record: MockEnrollmentCsvRecord): Promise<boolean> {
  return insertRecord(TABLES.enrollments, { id: record.submissionId, ...record });
}

export async function updateSupabaseEnrollment(
  submissionId: string,
  values: MockEnrollmentEditableValues,
): Promise<boolean> {
  const existing = await selectRecord(TABLES.enrollments, submissionId);
  if (!existing) return false;
  const current = decodeRecords<MockEnrollmentCsvRecord>([existing], "submissionId")[0];
  return updateRecord(TABLES.enrollments, submissionId, {
    id: submissionId,
    ...current,
    ...values,
  });
}

export async function deleteSupabaseEnrollment(submissionId: string): Promise<boolean> {
  return deleteRecord(TABLES.enrollments, submissionId);
}

export const supabaseStorageTables = TABLES;
