export type PublicationState = "draft" | "published";
export type ReviewState = "pending" | "confirmed";
export type SourceState = "pending" | "confirmed";

export interface ContentRecord {
  id: string;
  publicationState: PublicationState;
  reviewState: ReviewState;
  confirmedAt?: string;
}

export interface ContentCollection<T extends ContentRecord> {
  sourceState: SourceState;
  records: readonly T[];
}

export interface BrandContent extends ContentRecord {
  name: string;
  promise: string;
  heroEyebrow: string;
  heroLead: string;
  growthFlow: readonly string[];
  growthSystem: readonly { name: string; description: string }[];
  educationPrinciples: readonly { name: string; title: string; description: string }[];
  educationTracks: readonly { name: string; description: string }[];
  ecosystem: readonly { name: string; title: string; description: string }[];
  recruitPath: readonly string[];
  home: {
    brandStory: { eyebrow: string; title: string; description: string };
    salon: {
      eyebrow: string;
      englishTitle: string;
      title: string;
      description: string;
    };
    system: { eyebrow: string; title: string };
    haru: {
      eyebrow: string;
      englishTitle: string;
      title: string;
      description: string;
    };
    market: {
      eyebrow: string;
      englishTitle: string;
      title: string;
      description: string;
    };
    recruit: { eyebrow: string; title: string; description: string };
    ecosystem: { eyebrow: string; title: string };
    closing: { eyebrow: string; title: string; description: string };
  };
}

export interface ImageAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export type OperationState = "active" | "inactive" | "unknown";

export interface Branch extends ContentRecord {
  officialName: string;
  region?: string;
  address?: string;
  operationState: OperationState;
  introduction?: string;
  hours?: string;
  closedDays?: string;
  phone?: string;
  bookingUrl?: string;
  placeUrl?: string;
  directions?: string;
  parking?: string;
  amenities?: readonly string[];
  image?: ImageAsset;
}

export interface Designer extends ContentRecord {
  branchId: string;
  name: string;
  title: string;
  specialties: readonly string[];
  introduction?: string;
  profileImage?: ImageAsset;
  bookingUrl?: string;
}

export interface StylePortfolioItem extends ContentRecord {
  branchId: string;
  designerId?: string;
  name: string;
  serviceCategory: string;
  image: ImageAsset;
  description?: string;
}

export interface Instructor extends ContentRecord {
  name: string;
  title: string;
  specialties: readonly string[];
  introduction: string;
  career?: readonly string[];
  profileImage?: ImageAsset;
}

export type ClassCategory = "CUT" | "PERM" | "COLOR" | "CONSULTING" | "SALON_WORK";
export type RecruitmentStatus = "upcoming" | "open" | "closed" | "completed";

export interface ClassSession {
  startsAt: string;
  endsAt: string;
  timeZone: string;
  location: string;
}

export interface Tuition {
  amount: number;
  currency: "KRW";
  includes: readonly string[];
  materials?: readonly string[];
}

export interface AcademyClass extends ContentRecord {
  title: string;
  category: ClassCategory;
  instructorIds: readonly string[];
  instructorNames?: readonly string[];
  introduction: string;
  audience: readonly string[];
  curriculum: readonly string[];
  sessions: readonly ClassSession[];
  tuition: Tuition;
  cancellationPolicy: string;
  recruitmentStatus: RecruitmentStatus;
  applicationUrl?: string;
  deadlineAt?: string;
  image?: ImageAsset;
}

export interface JobPosting extends ContentRecord {
  title: string;
  branchId: string;
  role: string;
  experience: string;
  duties: readonly string[];
  qualifications: readonly string[];
  preferredQualifications?: readonly string[];
  workingConditions: string;
  salaryGuide: string;
  process: readonly string[];
  requiredDocuments: readonly string[];
  recruitmentStatus: RecruitmentStatus;
  deadlineAt?: string;
  applicationUrl?: string;
  inquiryUrl?: string;
}

export interface CooperationProgram extends ContentRecord {
  title: string;
  description: string;
  audience?: string;
  inquiryUrl?: string;
  institutionName?: string;
}

export interface CooperationInstitution extends ContentRecord {
  name: string;
  relationshipDescription: string;
}

export type LinkPurpose =
  | "market"
  | "featured-product"
  | "salon-booking"
  | "academy-application"
  | "recruitment"
  | "cooperation-inquiry"
  | "social"
  | "privacy"
  | "terms";

export interface CommonLink extends ContentRecord {
  purpose: LinkPurpose;
  label: string;
  url?: string;
  candidateValue?: string;
}

export type ActionBlockReason =
  | "not-public"
  | "not-operational"
  | "not-open"
  | "incomplete"
  | "missing-url"
  | "invalid-url"
  | "deadline-passed";

export interface ActionAvailability {
  enabled: boolean;
  href?: string;
  reason?: ActionBlockReason;
}

export type CollectionDisplayState = "preparing" | "empty" | "available";
