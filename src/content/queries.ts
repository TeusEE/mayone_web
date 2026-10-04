import "server-only";
import type {
  AcademyClass,
  BrandContent,
  CollectionDisplayState,
  ContentCollection,
  CommonLink,
  JobPosting,
  CooperationProgram,
} from "@/types/content";
import { brandCopy } from "@/content/brand";
import { classes } from "@/content/classes";
import { cooperationInstitutions, cooperationPrograms } from "@/content/cooperation";
import { instructors } from "@/content/instructors";
import { jobs } from "@/content/jobs";
import { commonLinks } from "@/content/links";
import { getCollectionState, getPublicRecords } from "@/lib/content-visibility";
import { getSupabasePublicAcademyClasses, isSupabaseStorageConfigured } from "@/lib/supabase-storage";

// 이 모듈은 서버 조회용입니다. Client Component에는 여기서 반환된 공개 레코드만 전달하세요.
export const getPublicBrandCopy = (): BrandContent | undefined => getPublicRecords(brandCopy)[0];
export function getBrandCopyForDevelopmentReview(): BrandContent | undefined {
  const publicCopy = getPublicBrandCopy();
  if (publicCopy || process.env.NODE_ENV !== "development") return publicCopy;
  return brandCopy.records[0];
}
export const getPublicInstructors = () => getPublicRecords(instructors);
export const getPublicClasses = () => getPublicRecords(classes);
export async function getPublicAcademyClassesForPage(): Promise<AcademyClass[]> {
  if (process.env.VERCEL_ENV === "production") {
    return isSupabaseStorageConfigured() ? getSupabasePublicAcademyClasses() : [];
  }
  return getPublicClasses();
}
export async function getPublicAcademyClassByIdForPage(id: string): Promise<AcademyClass | undefined> {
  return (await getPublicAcademyClassesForPage()).find((item) => item.id === id);
}
export const getPublicJobs = () => getPublicRecords(jobs);
export const getPublicCooperationPrograms = () => getPublicRecords(cooperationPrograms);
export const getPublicCooperationInstitutions = () => getPublicRecords(cooperationInstitutions);
export const getPublicCommonLinks = (): CommonLink[] => getPublicRecords(commonLinks);

export const getClassCollectionState = (): CollectionDisplayState => getCollectionState(classes);
export const getJobCollectionState = (): CollectionDisplayState => getCollectionState(jobs);
export const getCooperationCollectionState = (): CollectionDisplayState => getCollectionState(cooperationPrograms);

export function getCooperationProgramDraftsForDevelopmentReview(): CooperationProgram[] {
  if (process.env.NODE_ENV !== "development") return [];
  return [...cooperationPrograms.records];
}

export function getPublicRecordById<T extends { id: string }>(
  collection: ContentCollection<T & { publicationState: "draft" | "published"; reviewState: "pending" | "confirmed" }>,
  id: string,
): T | undefined {
  return getPublicRecords(collection).find((record) => record.id === id);
}

export const getPublicClassById = (id: string): AcademyClass | undefined => getPublicRecordById(classes, id);
export const getPublicJobById = (id: string): JobPosting | undefined => getPublicRecordById(jobs, id);
