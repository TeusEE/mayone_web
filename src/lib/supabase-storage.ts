import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
import type { Branch } from "@/types/content";
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
  return Boolean(getSupabaseUrl() || getSupabaseSecretKey());
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
  const { data, error } = await getSupabaseClient().from(table).select("id,data").order("id", { ascending: true });
  if (error) throw new Error(`Supabase ${table} 조회에 실패했습니다: ${error.message}`);
  return (data ?? []) as ManagedRecord[];
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
  const csv = serializeMockClassOffersCsv(offers);
  const result = parseMockClassOffers(csv);
  if (result.errors.length > 0 || result.offers.length !== offers.length) {
    throw new Error(`Supabase 과목 자료를 확인해 주세요: ${result.errors.join(" ")}`);
  }
  return result.offers;
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

export async function getSupabaseEnrollments(): Promise<MockEnrollmentCsvRecord[]> {
  const records = decodeRecords<MockEnrollmentCsvRecord>(await selectRecords(TABLES.enrollments), "submissionId");
  const csv = [MOCK_ENROLLMENT_CSV_HEADERS.join(","), ...records.map(serializeMockEnrollmentCsvRow)].join("\n");
  return parseMockEnrollmentCsv(csv);
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
