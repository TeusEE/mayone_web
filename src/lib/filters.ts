import type { AcademyClass, Branch, ClassCategory, RecruitmentStatus } from "@/types/content";

export function getBranchRegions(branches: readonly Branch[]): string[] {
  return [...new Set(branches.map((branch) => branch.region?.trim()).filter((value): value is string => Boolean(value)))]
    .sort((a, b) => a.localeCompare(b, "ko"));
}

export function filterBranches(branches: readonly Branch[], query = "", region = ""): Branch[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  return branches.filter((branch) => {
    const matchesName = !normalizedQuery || branch.officialName.toLocaleLowerCase("ko-KR").includes(normalizedQuery);
    return matchesName && (!region || branch.region === region);
  });
}

export function filterClasses(
  classes: readonly AcademyClass[],
  category: ClassCategory | "" = "",
  status: RecruitmentStatus | "" = "",
): AcademyClass[] {
  return classes.filter((item) => (!category || item.category === category) && (!status || item.recruitmentStatus === status));
}
