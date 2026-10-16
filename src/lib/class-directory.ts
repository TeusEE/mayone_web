import type { AcademyClass, ClassCategory } from "@/types/content";

export const classCategoryOrder: readonly ClassCategory[] = ["CUT", "PERM", "COLOR", "CONSULTING", "SALON_WORK"];
export const classCategoryLabels: Record<ClassCategory, string> = {
  CUT: "커트", PERM: "펌", COLOR: "컬러", CONSULTING: "디자인 상담", SALON_WORK: "살롱 실무",
};

export function getFirstClassSession(item: AcademyClass) {
  return item.sessions.reduce<AcademyClass["sessions"][number] | undefined>(
    (first, session) => !first || Date.parse(session.startsAt) < Date.parse(first.startsAt) ? session : first,
    undefined,
  );
}

export function groupAcademyClassesByCategoryAndStartDate(classes: readonly AcademyClass[]) {
  return classCategoryOrder.flatMap((category) => {
    const items = classes.filter((item) => item.category === category).sort((first, second) => {
      const firstStart = getFirstClassSession(first)?.startsAt;
      const secondStart = getFirstClassSession(second)?.startsAt;
      const difference = (firstStart ? Date.parse(firstStart) : Infinity) - (secondStart ? Date.parse(secondStart) : Infinity);
      return (Number.isNaN(difference) ? 0 : difference) || first.id.localeCompare(second.id);
    });
    return items.length > 0 ? [{ category, classes: items }] : [];
  });
}
