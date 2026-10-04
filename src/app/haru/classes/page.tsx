import { ClassDirectory } from "@/components/haru/ClassDirectory";
import { MockClassOffersDirectory } from "@/components/haru/MockClassOffersDirectory";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getMockClassOffers, isMockEnrollmentAvailable } from "@/content/mock-class-offers";
import { getClassCollectionState, getPublicAcademyClassesForPage, getPublicInstructors } from "@/content/queries";
import { createPageMetadata } from "@/lib/seo";
import styles from "@/app/content-pages.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const classes = await getPublicAcademyClassesForPage();
  return createPageMetadata({
    title: "HARU 교육 일정",
    description: "공개가 확인된 교육의 분야, 일정, 장소, 비용과 모집 상태를 안내합니다.",
    path: "/haru/classes",
    contentAvailable: classes.length > 0,
  });
}

export default async function ClassDirectoryPage() {
  const classes = await getPublicAcademyClassesForPage();
  const collectionState = process.env.VERCEL_ENV === "production"
    ? (classes.length > 0 ? "available" : "empty")
    : getClassCollectionState();
  const instructorIds = new Set(classes.flatMap((item) => item.instructorIds));
  const instructors = getPublicInstructors().filter((instructor) => instructorIds.has(instructor.id));
  const demoEnabled = isMockEnrollmentAvailable();
  const mockOffers = demoEnabled ? (await getMockClassOffers()).offers : [];

  return (
    <div className={styles.page}>
      <SectionHeading eyebrow="HARU · CLASS" title="HARU 교육 일정" description="공개가 확인된 교육의 분야와 모집 상태, 일정과 비용을 안내합니다." />
      {classes.length > 0 ? (
        <ClassDirectory classes={classes} instructors={instructors} />
      ) : !demoEnabled ? (
        <EmptyState
          kind={collectionState === "preparing" ? "preparing" : "empty"}
          title={collectionState === "preparing" ? "교육 일정을 준비하고 있습니다." : "현재 신청 가능한 교육이 없습니다."}
          description={collectionState === "preparing" ? "확정된 일정과 신청 정보를 확인한 뒤 공개하겠습니다." : "새 교육의 모집이 확정되면 이곳에서 안내합니다."}
        />
      ) : null}
      {demoEnabled ? <MockClassOffersDirectory offers={mockOffers} /> : null}
    </div>
  );
}
