import "server-only";

import { join } from "node:path";
import { branches as sourceBranches } from "@/content/branches";
import { getCollectionState, getPublicRecords } from "@/lib/content-visibility";
import { isMockEnrollmentCsvStorageAvailable } from "@/content/mock-class-offers";
import { readLocalBranchCatalog } from "@/lib/local-branch-store";
import { getSupabaseBranches, hasSupabaseStorageConfiguration, isSupabaseStorageConfigured } from "@/lib/supabase-storage";
import type { Branch, ContentCollection } from "@/types/content";

const localBranchPath = join(process.cwd(), ".local-data", "branches.json");

export async function getLocalBranchCatalog(): Promise<Branch[]> {
  if (!isMockEnrollmentCsvStorageAvailable()) throw new Error("지점 관리는 로컬 개발 서버에서만 사용할 수 있습니다.");
  if (hasSupabaseStorageConfiguration()) {
    if (!isSupabaseStorageConfigured()) throw new Error("Supabase 환경변수를 확인해 주세요.");
    return getSupabaseBranches();
  }
  return readLocalBranchCatalog(localBranchPath, sourceBranches.records);
}

export async function getSalonDirectoryData(): Promise<{
  branches: Branch[];
  collectionState: ReturnType<typeof getCollectionState<Branch>>;
}> {
  let records = sourceBranches.records;
  if (hasSupabaseStorageConfiguration()) {
    if (!isSupabaseStorageConfigured()) throw new Error("Supabase 환경변수를 확인해 주세요.");
    records = await getSupabaseBranches();
  } else if (isMockEnrollmentCsvStorageAvailable()) {
    try {
      records = await getLocalBranchCatalog();
    } catch {
      // Keep the verified checked-in directory visible while the local file is repaired in admin.
    }
  }

  const collection: ContentCollection<Branch> = { ...sourceBranches, records };
  return { branches: getPublicRecords(collection), collectionState: getCollectionState(collection) };
}
