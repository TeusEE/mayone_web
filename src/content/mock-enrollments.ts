import "server-only";

import { join } from "node:path";
import { isMockEnrollmentCsvStorageAvailable } from "@/content/mock-class-offers";
import { readMockEnrollmentCsv } from "@/lib/mock-enrollment-csv";
import { getSupabaseEnrollments, hasSupabaseStorageConfiguration, isSupabaseStorageConfigured } from "@/lib/supabase-storage";

export async function getMockEnrollmentRecords() {
  if (hasSupabaseStorageConfiguration()) {
    if (!isSupabaseStorageConfigured()) throw new Error("Supabase 환경변수를 확인해 주세요.");
    return getSupabaseEnrollments();
  }
  if (!isMockEnrollmentCsvStorageAvailable()) throw new Error("로컬 신청 자료는 개발 서버에서만 사용할 수 있습니다.");
  return readMockEnrollmentCsv(join(process.cwd(), ".local-data", "mock-enrollments.csv"));
}

export function getMockEnrollmentStorageTarget(): "supabase" | "local" | "unavailable" {
  if (isSupabaseStorageConfigured()) return "supabase";
  if (hasSupabaseStorageConfiguration()) return "unavailable";
  return isMockEnrollmentCsvStorageAvailable() ? "local" : "unavailable";
}
