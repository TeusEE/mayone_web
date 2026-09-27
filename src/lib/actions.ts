import type {
  ActionAvailability,
  AcademyClass,
  Branch,
  Designer,
  JobPosting,
} from "@/types/content";

export function isValidExternalUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function getBranchBookingAvailability(branch: Branch): ActionAvailability {
  if (branch.publicationState !== "published" || branch.reviewState !== "confirmed") {
    return { enabled: false, reason: "not-public" };
  }
  if (branch.operationState !== "active") {
    return { enabled: false, reason: "not-operational" };
  }
  if (!branch.officialName.trim() || !branch.region?.trim() || !branch.address?.trim()) {
    return { enabled: false, reason: "incomplete" };
  }
  if (!branch.bookingUrl) return { enabled: false, reason: "missing-url" };
  if (!isValidExternalUrl(branch.bookingUrl)) return { enabled: false, reason: "invalid-url" };
  return { enabled: true, href: branch.bookingUrl };
}

export function getDesignerBookingAvailability(
  designer: Designer,
  branch: Branch,
): ActionAvailability {
  if (designer.publicationState !== "published" || designer.reviewState !== "confirmed") {
    return { enabled: false, reason: "not-public" };
  }
  if (branch.operationState !== "active") return { enabled: false, reason: "not-operational" };
  if (!designer.name.trim() || !branch.officialName.trim()) return { enabled: false, reason: "incomplete" };
  if (!designer.bookingUrl) return { enabled: false, reason: "missing-url" };
  if (!isValidExternalUrl(designer.bookingUrl)) return { enabled: false, reason: "invalid-url" };
  return { enabled: true, href: designer.bookingUrl };
}

function hasClassApplicationDetails(item: AcademyClass): boolean {
  return Boolean(
    item.title.trim() &&
      item.introduction.trim() &&
      item.audience.length > 0 &&
      item.curriculum.length > 0 &&
      item.sessions.length > 0 &&
      item.sessions.every((session) =>
        session.location.trim() &&
        session.timeZone.trim() &&
        Number.isFinite(Date.parse(session.startsAt)) &&
        Number.isFinite(Date.parse(session.endsAt)) &&
        Date.parse(session.endsAt) > Date.parse(session.startsAt),
      ) &&
      item.tuition.amount >= 0 &&
      item.tuition.currency === "KRW" &&
      item.cancellationPolicy.trim() &&
      item.instructorIds.length > 0,
  );
}

export function getClassApplicationAvailability(
  item: AcademyClass,
  now: Date = new Date(),
): ActionAvailability {
  if (item.publicationState !== "published" || item.reviewState !== "confirmed") {
    return { enabled: false, reason: "not-public" };
  }
  if (item.recruitmentStatus !== "open") return { enabled: false, reason: "not-open" };
  if (!hasClassApplicationDetails(item)) return { enabled: false, reason: "incomplete" };
  if (!item.applicationUrl) return { enabled: false, reason: "missing-url" };
  if (!isValidExternalUrl(item.applicationUrl)) return { enabled: false, reason: "invalid-url" };
  if (item.deadlineAt && (!Number.isFinite(Date.parse(item.deadlineAt)) || now.getTime() >= Date.parse(item.deadlineAt))) {
    return { enabled: false, reason: "deadline-passed" };
  }
  const lastSessionEnd = Math.max(...item.sessions.map((session) => Date.parse(session.endsAt)));
  if (now.getTime() >= lastSessionEnd) return { enabled: false, reason: "not-open" };
  return { enabled: true, href: item.applicationUrl };
}

function hasJobApplicationDetails(item: JobPosting): boolean {
  return Boolean(
    item.title.trim() &&
      item.branchId.trim() &&
      item.role.trim() &&
      item.experience.trim() &&
      item.duties.length > 0 &&
      item.qualifications.length > 0 &&
      item.workingConditions.trim() &&
      item.salaryGuide.trim() &&
      item.process.length > 0 &&
      item.requiredDocuments.length > 0,
  );
}

export function getJobApplicationAvailability(
  item: JobPosting,
  now: Date = new Date(),
): ActionAvailability {
  if (item.publicationState !== "published" || item.reviewState !== "confirmed") {
    return { enabled: false, reason: "not-public" };
  }
  if (item.recruitmentStatus !== "open") return { enabled: false, reason: "not-open" };
  if (!hasJobApplicationDetails(item)) return { enabled: false, reason: "incomplete" };
  if (!item.applicationUrl) return { enabled: false, reason: "missing-url" };
  if (!isValidExternalUrl(item.applicationUrl)) return { enabled: false, reason: "invalid-url" };
  if (item.deadlineAt && (!Number.isFinite(Date.parse(item.deadlineAt)) || now.getTime() >= Date.parse(item.deadlineAt))) {
    return { enabled: false, reason: "deadline-passed" };
  }
  return { enabled: true, href: item.applicationUrl };
}
