import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { join } from "node:path";
import { branches } from "../src/content/branches";
import { parseMockClassOffers } from "../src/lib/mock-class-offers";
import { readLocalBranchCatalog } from "../src/lib/local-branch-store";
import { parseMockEnrollmentCsv } from "../src/lib/mock-enrollment-csv";
import { getSupabaseDataTarget, isSupabaseStorageConfigured, supabaseStorageTables, upsertSupabaseRecords } from "../src/lib/supabase-storage";

const projectRoot = process.cwd();
const branchPath = join(projectRoot, ".local-data", "branches.json");
const offerPath = join(projectRoot, ".local-data", "mock-class-offers.csv");
const enrollmentPath = join(projectRoot, ".local-data", "mock-enrollments.csv");

async function readFileOrFallback(path: string, fallbackPath: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
    return readFile(fallbackPath, "utf8");
  }
}

async function readExistingEnrollments(): Promise<ReturnType<typeof parseMockEnrollmentCsv>> {
  try {
    return parseMockEnrollmentCsv(await readFile(enrollmentPath, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    loadEnvFile(join(projectRoot, ".env.local"));
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
  }

  if (!isSupabaseStorageConfigured()) {
    throw new Error("Supabase 저장을 시작할 수 없습니다. .env.local에 테스트 DB의 URL·Secret key와 SUPABASE_DATA_TARGET=test를 설정해 주세요.");
  }
  if (getSupabaseDataTarget() !== "test") {
    throw new Error("로컬 mock 데이터를 production DB로 가져올 수 없습니다. 테스트 DB 연결을 확인해 주세요.");
  }

  const branchRecords = await readLocalBranchCatalog(branchPath, branches.records);
  const offerCsv = await readFileOrFallback(offerPath, join(projectRoot, "src/content/fixtures/class-offers.csv"));
  const parsedOffers = parseMockClassOffers(offerCsv);
  if (parsedOffers.errors.length > 0) throw new Error(`로컬 과목 CSV를 확인해 주세요: ${parsedOffers.errors.join(" ")}`);
  const enrollmentRecords = await readExistingEnrollments();

  await Promise.all([
    upsertSupabaseRecords(supabaseStorageTables.branches, branchRecords),
    upsertSupabaseRecords(supabaseStorageTables.classOffers, parsedOffers.offers),
    upsertSupabaseRecords(
      supabaseStorageTables.enrollments,
      enrollmentRecords.map((record) => ({ id: record.submissionId, ...record })),
    ),
  ]);

  console.log(`Supabase 가져오기 완료: 지점 ${branchRecords.length}곳, 과목 ${parsedOffers.offers.length}개, 테스트 신청 ${enrollmentRecords.length}건`);
  console.log("기존 로컬 파일은 백업을 위해 그대로 두었습니다.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Supabase 데이터 가져오기에 실패했습니다.");
  process.exitCode = 1;
});
