import "server-only";

import { cache } from "react";
import { join } from "node:path";
import { branches as sourceBranches } from "@/content/branches";
import { getCollectionState, getPublicRecords } from "@/lib/content-visibility";
import { isMockEnrollmentCsvStorageAvailable } from "@/content/mock-class-offers";
import { readLocalBranchCatalog } from "@/lib/local-branch-store";
import { getSupabaseBranches, hasSupabaseStorageConfiguration, isSupabaseStorageConfigured } from "@/lib/supabase-storage";
import type { Branch, ContentCollection } from "@/types/content";

const localBranchPath = join(process.cwd(), ".local-data", "branches.json");

export async function getAdminBranchCatalog(): Promise<Branch[]> {
  if (hasSupabaseStorageConfiguration()) {
    if (!isSupabaseStorageConfigured()) throw new Error("Supabase 환경변수를 확인해 주세요.");
    return getSupabaseBranches();
  }
  if (!isMockEnrollmentCsvStorageAvailable()) throw new Error("로컬 지점 자료는 개발 서버에서만 사용할 수 있습니다.");
  return readLocalBranchCatalog(localBranchPath, sourceBranches.records);
}

export const getSalonDirectoryData = cache(async (): Promise<{
  branches: Branch[];
  collectionState: ReturnType<typeof getCollectionState<Branch>>;
}> => {
  let records = sourceBranches.records;
  if (hasSupabaseStorageConfiguration()) {
    if (!isSupabaseStorageConfigured()) throw new Error("Supabase 환경변수를 확인해 주세요.");
    records = await getSupabaseBranches();
  } else if (isMockEnrollmentCsvStorageAvailable()) {
    try {
      records = await getAdminBranchCatalog();
    } catch {
      // Keep the verified checked-in directory visible while the local file is repaired in admin.
    }
  }

  const collection: ContentCollection<Branch> = { ...sourceBranches, records };
  // Only send public fields to clients; stored JSON may also contain internal notes.
  const branches = getPublicRecords(collection).map((branch): Branch => ({
    id: branch.id,
    publicationState: branch.publicationState,
    reviewState: branch.reviewState,
    confirmedAt: branch.confirmedAt,
    officialName: branch.officialName,
    operationState: branch.operationState,
    region: branch.region,
    address: branch.address,
    introduction: branch.introduction,
    hours: branch.hours,
    closedDays: branch.closedDays,
    phone: branch.phone,
    bookingUrl: branch.bookingUrl,
    directions: branch.directions,
    parking: branch.parking,
    amenities: branch.amenities,
    image: branch.image ? {
      src: branch.image.src,
      alt: branch.image.alt,
      width: branch.image.width,
      height: branch.image.height,
    } : undefined,
  }));
  return { branches, collectionState: getCollectionState(collection) };
});
