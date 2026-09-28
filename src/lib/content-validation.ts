import type {
  AcademyClass,
  Branch,
  BrandContent,
  CommonLink,
  ContentCollection,
  ContentRecord,
  CooperationInstitution,
  CooperationProgram,
  Designer,
  Instructor,
  JobPosting,
  StylePortfolioItem,
} from "@/types/content";
import { isValidExternalUrl } from "@/lib/actions";
import { isValidImageSource } from "@/lib/image";

type Validator<T extends ContentRecord> = (record: T) => string[];

function isZonedDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("ko-KR", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function validateBase<T extends ContentRecord>(record: T): string[] {
  const errors: string[] = [];
  if (!record.id.trim()) errors.push("ID가 비어 있습니다.");
  if (record.publicationState === "published" && record.reviewState !== "confirmed") {
    errors.push("공개 항목은 검토 상태가 confirmed여야 합니다.");
  }
  if (record.publicationState === "published" && !record.confirmedAt) {
    errors.push("공개 항목은 확인일이 필요합니다.");
  }
  if (record.confirmedAt && !isZonedDate(record.confirmedAt)) {
    errors.push("확인일은 시간대가 포함된 ISO 날짜여야 합니다.");
  }
  return errors;
}

function requiredPublished(record: ContentRecord, checks: readonly [string, boolean][]): string[] {
  if (record.publicationState !== "published") return [];
  return checks.filter(([, valid]) => !valid).map(([label]) => `공개 필수값 누락: ${label}`);
}

function validateImageAsset(image: { src: string; alt: string; width?: number; height?: number } | undefined): string[] {
  if (!image) return [];
  const issues: string[] = [];
  if (!isValidImageSource(image.src)) issues.push("이미지 주소는 공개 로컬 경로 또는 HTTPS 주소여야 합니다.");
  if (!image.alt.trim()) issues.push("이미지 대체 텍스트가 필요합니다.");
  if (image.width !== undefined && (!Number.isFinite(image.width) || image.width <= 0)) issues.push("이미지 너비는 0보다 커야 합니다.");
  if (image.height !== undefined && (!Number.isFinite(image.height) || image.height <= 0)) issues.push("이미지 높이는 0보다 커야 합니다.");
  return issues;
}

function validateBrand(record: BrandContent): string[] {
  const home = record.home;
  const editorialSections = [home.brandStory, home.salon, home.system, home.haru, home.market, home.recruit, home.ecosystem, home.closing];
  const hasText = (value: string) => Boolean(value.trim());

  return requiredPublished(record, [
    ["브랜드명", hasText(record.name)],
    ["브랜드 약속", hasText(record.promise)],
    ["첫 화면 설명", hasText(record.heroEyebrow) && hasText(record.heroLead)],
    ["브랜드 성장 구조 5단계", record.growthFlow.length === 5 && record.growthFlow.every(hasText)],
    ["성장 시스템 5개", record.growthSystem.length === 5 && record.growthSystem.every((item) => hasText(item.name) && hasText(item.description))],
    ["교육 원칙 4개", record.educationPrinciples.length === 4 && record.educationPrinciples.every((item) => hasText(item.name) && hasText(item.title) && hasText(item.description))],
    ["기본 교육 분야 5개", record.educationTracks.length === 5 && record.educationTracks.every((item) => hasText(item.name) && hasText(item.description))],
    ["브랜드 생태계 3개", record.ecosystem.length === 3 && record.ecosystem.every((item) => hasText(item.name) && hasText(item.title) && hasText(item.description))],
    ["성장 경로 4단계", record.recruitPath.length === 4 && record.recruitPath.every(hasText)],
    ["메인 섹션 8개", editorialSections.length === 8 && editorialSections.every((section) => hasText(section.eyebrow) && hasText(section.title))],
    ["살롱 소개", hasText(home.salon.englishTitle) && hasText(home.salon.description)],
    ["HARU 소개", hasText(home.haru.englishTitle) && hasText(home.haru.description)],
    ["마켓 소개", hasText(home.market.englishTitle) && hasText(home.market.description)],
    ["채용 소개", hasText(home.recruit.description)],
    ["마지막 안내", hasText(home.closing.description)],
  ]);
}

function validateCollection<T extends ContentRecord>(
  name: string,
  collection: ContentCollection<T>,
  validateRecord: Validator<T>,
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const record of collection.records) {
    if (ids.has(record.id)) issues.push(`${name}: 중복 ID ${record.id}`);
    ids.add(record.id);
    for (const message of [...validateBase(record), ...validateRecord(record)]) {
      issues.push(`${name}/${record.id}: ${message}`);
    }
  }

  return issues;
}

function validateBranch(record: Branch): string[] {
  const errors = [
    ...requiredPublished(record, [
      ["공식 지점명", Boolean(record.officialName.trim())],
      ["확정 지역", Boolean(record.region?.trim())],
      ["주소", Boolean(record.address?.trim())],
      ["운영 여부", record.operationState !== "unknown"],
    ]),
    ...validateImageAsset(record.image),
  ];
  if (record.bookingUrl && !isValidExternalUrl(record.bookingUrl)) errors.push("예약 URL은 HTTPS 주소여야 합니다.");
  if (record.placeUrl && !isValidExternalUrl(record.placeUrl)) errors.push("네이버 플레이스 URL은 HTTPS 주소여야 합니다.");
  return errors;
}

function validateDesigner(record: Designer): string[] {
  return [
    ...requiredPublished(record, [
      ["소속 지점", Boolean(record.branchId.trim())],
      ["이름", Boolean(record.name.trim())],
      ["직책", Boolean(record.title.trim())],
      ["분야", record.specialties.length > 0],
    ]),
    ...validateImageAsset(record.profileImage),
  ];
}

function validateStyle(record: StylePortfolioItem): string[] {
  return [
    ...requiredPublished(record, [
      ["지점", Boolean(record.branchId.trim())],
      ["스타일명", Boolean(record.name.trim())],
      ["시술 분야", Boolean(record.serviceCategory.trim())],
      ["실제 이미지와 대체 텍스트", isValidImageSource(record.image.src) && Boolean(record.image.alt.trim())],
    ]),
    ...validateImageAsset(record.image),
  ];
}

function validateInstructor(record: Instructor): string[] {
  return [
    ...requiredPublished(record, [
      ["이름", Boolean(record.name.trim())],
      ["직책", Boolean(record.title.trim())],
      ["분야", record.specialties.length > 0],
      ["소개", Boolean(record.introduction.trim())],
    ]),
    ...validateImageAsset(record.profileImage),
  ];
}

function validateClass(record: AcademyClass): string[] {
  const errors = requiredPublished(record, [
    ["교육명", Boolean(record.title.trim())],
    ["분야", Boolean(record.category)],
    ["강사", record.instructorIds.length > 0],
    ["교육 내용", Boolean(record.introduction.trim())],
    ["대상", record.audience.length > 0],
    ["커리큘럼", record.curriculum.length > 0],
    ["일정", record.sessions.length > 0],
    ["교육비", record.tuition.amount >= 0 && record.tuition.currency === "KRW"],
    ["취소 안내", Boolean(record.cancellationPolicy.trim())],
  ]);

  errors.push(...validateImageAsset(record.image));

  for (const [index, session] of record.sessions.entries()) {
    if (!isZonedDate(session.startsAt) || !isZonedDate(session.endsAt)) {
      errors.push(`회차 ${index + 1}: 일정에 시간대가 포함된 ISO 날짜가 필요합니다.`);
    } else if (Date.parse(session.endsAt) <= Date.parse(session.startsAt)) {
      errors.push(`회차 ${index + 1}: 종료 시각은 시작 시각 이후여야 합니다.`);
    }
    if (!isValidTimeZone(session.timeZone)) errors.push(`회차 ${index + 1}: 유효한 시간대가 필요합니다.`);
    if (!session.location.trim()) errors.push(`회차 ${index + 1}: 장소가 필요합니다.`);
  }

  if (record.tuition.amount < 0) errors.push("교육비는 0 이상이어야 합니다.");
  if (record.deadlineAt && !isZonedDate(record.deadlineAt)) errors.push("신청 마감일은 시간대가 포함된 ISO 날짜여야 합니다.");
  if (record.applicationUrl && !isValidExternalUrl(record.applicationUrl)) errors.push("신청 URL은 HTTPS 주소여야 합니다.");
  if (record.recruitmentStatus === "open") {
    errors.push(...requiredPublished(record, [
      ["모집 중 교육의 신청 URL", isValidExternalUrl(record.applicationUrl)],
    ]));
  }
  return errors;
}

function validateJob(record: JobPosting): string[] {
  const errors = requiredPublished(record, [
    ["공고명", Boolean(record.title.trim())],
    ["지점 ID", Boolean(record.branchId.trim())],
    ["직무", Boolean(record.role.trim())],
    ["경력", Boolean(record.experience.trim())],
    ["업무", record.duties.length > 0],
    ["자격", record.qualifications.length > 0],
    ["근무 조건", Boolean(record.workingConditions.trim())],
    ["급여 안내", Boolean(record.salaryGuide.trim())],
    ["전형", record.process.length > 0],
    ["제출 자료", record.requiredDocuments.length > 0],
  ]);
  if (record.deadlineAt && !isZonedDate(record.deadlineAt)) errors.push("마감일은 시간대가 포함된 ISO 날짜여야 합니다.");
  if (record.applicationUrl && !isValidExternalUrl(record.applicationUrl)) errors.push("지원 URL은 HTTPS 주소여야 합니다.");
  if (record.inquiryUrl && !isValidExternalUrl(record.inquiryUrl)) errors.push("문의 URL은 HTTPS 주소여야 합니다.");
  if (record.recruitmentStatus === "open") {
    errors.push(...requiredPublished(record, [
      ["모집 중 공고의 지원 URL", isValidExternalUrl(record.applicationUrl)],
    ]));
  }
  return errors;
}

function validateCooperation(record: CooperationProgram): string[] {
  const errors = requiredPublished(record, [
    ["프로그램명", Boolean(record.title.trim())],
    ["프로그램 설명", Boolean(record.description.trim())],
  ]);
  if (record.inquiryUrl && !isValidExternalUrl(record.inquiryUrl)) errors.push("문의 URL은 HTTPS 주소여야 합니다.");
  return errors;
}

function validateCooperationInstitution(record: CooperationInstitution): string[] {
  return requiredPublished(record, [
    ["기관명", Boolean(record.name.trim())],
    ["관계 설명", Boolean(record.relationshipDescription.trim())],
  ]);
}

function validateLink(record: CommonLink): string[] {
  const errors: string[] = [];
  if (!record.label.trim()) errors.push("링크 이름이 비어 있습니다.");
  if (record.url && !isValidExternalUrl(record.url)) errors.push("외부 URL은 HTTPS 주소여야 합니다.");
  if (record.publicationState === "published" && !record.url) errors.push("공개 링크의 URL이 필요합니다.");
  return errors;
}

export interface ContentCollections {
  brand: ContentCollection<BrandContent>;
  branches: ContentCollection<Branch>;
  designers: ContentCollection<Designer>;
  styles: ContentCollection<StylePortfolioItem>;
  instructors: ContentCollection<Instructor>;
  classes: ContentCollection<AcademyClass>;
  jobs: ContentCollection<JobPosting>;
  cooperation: ContentCollection<CooperationProgram>;
  cooperationInstitutions: ContentCollection<CooperationInstitution>;
  links: ContentCollection<CommonLink>;
}

export function validateContent(collections: ContentCollections): string[] {
  const errors = [
    ...validateCollection("brand", collections.brand, validateBrand),
    ...validateCollection("branches", collections.branches, validateBranch),
    ...validateCollection("designers", collections.designers, validateDesigner),
    ...validateCollection("styles", collections.styles, validateStyle),
    ...validateCollection("instructors", collections.instructors, validateInstructor),
    ...validateCollection("classes", collections.classes, validateClass),
    ...validateCollection("jobs", collections.jobs, validateJob),
    ...validateCollection("cooperation", collections.cooperation, validateCooperation),
    ...validateCollection("cooperationInstitutions", collections.cooperationInstitutions, validateCooperationInstitution),
    ...validateCollection("links", collections.links, validateLink),
  ];

  const recordGroups = [
    ["brand", collections.brand.records],
    ["branches", collections.branches.records],
    ["designers", collections.designers.records],
    ["styles", collections.styles.records],
    ["instructors", collections.instructors.records],
    ["classes", collections.classes.records],
    ["jobs", collections.jobs.records],
    ["cooperation", collections.cooperation.records],
    ["cooperationInstitutions", collections.cooperationInstitutions.records],
    ["links", collections.links.records],
  ] as const;
  const ownerById = new Map<string, string>();
  for (const [group, records] of recordGroups) {
    for (const record of records) {
      const previousGroup = ownerById.get(record.id);
      if (previousGroup && previousGroup !== group) {
        errors.push(`중복 ID ${record.id}: ${previousGroup}와 ${group}에 함께 있습니다.`);
      } else {
        ownerById.set(record.id, group);
      }
    }
  }

  const branchIds = new Set(collections.branches.records.map((record) => record.id));
  const publicBranchIds = new Set(collections.branches.records.filter((record) => record.publicationState === "published" && record.reviewState === "confirmed").map((record) => record.id));
  const designerIds = new Set(collections.designers.records.map((record) => record.id));
  const publicDesignerIds = new Set(collections.designers.records.filter((record) => record.publicationState === "published" && record.reviewState === "confirmed").map((record) => record.id));
  const instructorIds = new Set(collections.instructors.records.map((record) => record.id));
  const publicInstructorIds = new Set(collections.instructors.records.filter((record) => record.publicationState === "published" && record.reviewState === "confirmed").map((record) => record.id));

  for (const designer of collections.designers.records) {
    const references = designer.publicationState === "published" ? publicBranchIds : branchIds;
    if (!references.has(designer.branchId)) errors.push(`designers/${designer.id}: 공개 가능한 지점 참조를 찾을 수 없습니다 (${designer.branchId}).`);
  }
  for (const style of collections.styles.records) {
    const branchReferences = style.publicationState === "published" ? publicBranchIds : branchIds;
    const designerReferences = style.publicationState === "published" ? publicDesignerIds : designerIds;
    if (!branchReferences.has(style.branchId)) errors.push(`styles/${style.id}: 공개 가능한 지점 참조를 찾을 수 없습니다 (${style.branchId}).`);
    if (style.designerId && !designerReferences.has(style.designerId)) errors.push(`styles/${style.id}: 공개 가능한 디자이너 참조를 찾을 수 없습니다 (${style.designerId}).`);
  }
  for (const item of collections.classes.records) {
    const references = item.publicationState === "published" ? publicInstructorIds : instructorIds;
    for (const instructorId of item.instructorIds) {
      if (!references.has(instructorId)) errors.push(`classes/${item.id}: 공개 가능한 강사 참조를 찾을 수 없습니다 (${instructorId}).`);
    }
  }
  for (const job of collections.jobs.records) {
    const references = job.publicationState === "published" ? publicBranchIds : branchIds;
    if (!references.has(job.branchId)) errors.push(`jobs/${job.id}: 공개 가능한 지점 참조를 찾을 수 없습니다 (${job.branchId}).`);
  }

  return errors;
}
