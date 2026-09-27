import "server-only";
import type {
  AcademyClass,
  BrandContent,
  Branch,
  CollectionDisplayState,
  ContentCollection,
  CommonLink,
  Designer,
  Instructor,
  JobPosting,
  StylePortfolioItem,
  CooperationInstitution,
  CooperationProgram,
} from "@/types/content";
import { branches } from "@/content/branches";
import { brandCopy } from "@/content/brand";
import { classes } from "@/content/classes";
import { cooperationInstitutions, cooperationPrograms } from "@/content/cooperation";
import { designers } from "@/content/designers";
import { instructors } from "@/content/instructors";
import { jobs } from "@/content/jobs";
import { commonLinks } from "@/content/links";
import { styles } from "@/content/styles";
import { getCollectionState, getPublicRecords } from "@/lib/content-visibility";

// 이 모듈은 서버 조회용입니다. Client Component에는 여기서 반환된 공개 레코드만 전달하세요.
export const getPublicBranches = () => getPublicRecords(branches);
export const getPublicBrandCopy = (): BrandContent | undefined => getPublicRecords(brandCopy)[0];
export function getBrandCopyForDevelopmentReview(): BrandContent | undefined {
  const publicCopy = getPublicBrandCopy();
  const allowDraftPreview =
    process.env.NODE_ENV === "development" ||
    (process.env.VERCEL_ENV === "preview" && process.env.MAYONE_PREVIEW_DRAFT_CONTENT === "true");

  if (publicCopy || !allowDraftPreview) return publicCopy;
  return brandCopy.records[0];
}
export const getPublicDesigners = () => getPublicRecords(designers);
export const getPublicStyles = () => getPublicRecords(styles);
export const getPublicInstructors = () => getPublicRecords(instructors);
export const getPublicClasses = () => getPublicRecords(classes);
export const getPublicJobs = () => getPublicRecords(jobs);
export const getPublicCooperationPrograms = () => getPublicRecords(cooperationPrograms);
export const getPublicCooperationInstitutions = () => getPublicRecords(cooperationInstitutions);
export const getPublicCommonLinks = (): CommonLink[] => getPublicRecords(commonLinks);

export const getBranchCollectionState = (): CollectionDisplayState => getCollectionState(branches);
export const getDesignerCollectionState = (): CollectionDisplayState => getCollectionState(designers);
export const getStyleCollectionState = (): CollectionDisplayState => getCollectionState(styles);
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

export const getPublicBranchById = (id: string): Branch | undefined => getPublicRecordById(branches, id);
export const getPublicDesignerById = (id: string): Designer | undefined => getPublicRecordById(designers, id);
export const getPublicStyleById = (id: string): StylePortfolioItem | undefined => getPublicRecordById(styles, id);
export const getPublicClassById = (id: string): AcademyClass | undefined => getPublicRecordById(classes, id);
export const getPublicJobById = (id: string): JobPosting | undefined => getPublicRecordById(jobs, id);
export const getPublicInstructorById = (id: string): Instructor | undefined => getPublicRecordById(instructors, id);
export const getPublicCooperationProgramById = (id: string): CooperationProgram | undefined => getPublicRecordById(cooperationPrograms, id);
export const getPublicCooperationInstitutionById = (id: string): CooperationInstitution | undefined => getPublicRecordById(cooperationInstitutions, id);
