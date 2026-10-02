import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EnrollmentApplicationForm } from "@/components/haru/EnrollmentApplicationForm";
import { getMockClassOffers, isMockEnrollmentAvailable } from "@/content/mock-class-offers";
import { getMockEnrollmentStorageTarget } from "@/content/mock-enrollments";
import { canApplyToMockOffer } from "@/lib/mock-class-offers";
import { createPageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

type ApplyPageProps = {
  searchParams: Promise<{ classId?: string | string[] }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const isDemo = isMockEnrollmentAvailable();
  return createPageMetadata({
    title: isDemo ? "수강 신청 테스트" : "수강 신청",
    description: isDemo ? "HARU 수강 신청 화면의 테스트용 시연입니다." : "HARU 수강 신청 정보를 준비하고 있습니다.",
    path: "/haru/apply",
    contentAvailable: false,
  });
}

export default async function ApplyPage({ searchParams }: ApplyPageProps) {
  const query = await searchParams;
  const requestedClassId = typeof query.classId === "string" ? query.classId : undefined;

  if (!isMockEnrollmentAvailable()) {
    return (
      <div className={styles.page}>
        <SectionHeading eyebrow="HARU · APPLICATION" title="수강 신청" description="과정과 신청 정보를 준비하고 있습니다." titleId="application-form-title" />
        <EmptyState
          kind="preparing"
          title="수강 신청을 준비하고 있습니다."
          description="확정된 교육 일정과 신청 안내를 확인한 뒤 이 페이지를 열겠습니다."
        />
      </div>
    );
  }

  const { offers } = await getMockClassOffers();
  const initialClassId = requestedClassId && offers.some((offer) => offer.id === requestedClassId && canApplyToMockOffer(offer))
    ? requestedClassId
    : undefined;

  return (
    <div className={styles.page}>
      <EnrollmentApplicationForm
        offers={offers}
        initialClassId={initialClassId}
        requestedClassId={requestedClassId}
        queryWasRepeated={Array.isArray(query.classId)}
        storageTarget={getMockEnrollmentStorageTarget()}
      />
    </div>
  );
}
