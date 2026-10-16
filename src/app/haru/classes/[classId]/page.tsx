import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ClassDetail } from "@/components/haru/ClassDetail";
import { MockClassOfferDetail } from "@/components/haru/MockClassOfferDetail";
import { getMockClassOffers, isMockEnrollmentAvailable } from "@/content/mock-class-offers";
import { getPublicAcademyClassByIdForPage, getPublicClasses, getPublicInstructors } from "@/content/queries";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  const publishedClasses = getPublicClasses().map((item) => ({ classId: item.id }));
  if (!isMockEnrollmentAvailable()) return publishedClasses;

  const mockOffers = (await getMockClassOffers()).offers.map((offer) => ({ classId: offer.id }));
  const classIds = new Set(publishedClasses.map((item) => item.classId));
  return [...publishedClasses, ...mockOffers.filter((item) => !classIds.has(item.classId))];
}

export async function generateMetadata({ params }: { params: Promise<{ classId: string }> }): Promise<Metadata> {
  const { classId } = await params;
  const item = await getPublicAcademyClassByIdForPage(classId);
  if (!item && isMockEnrollmentAvailable()) {
    const mockOffer = (await getMockClassOffers()).offers.find((offer) => offer.id === classId);
    if (mockOffer) {
      return createPageMetadata({
        title: mockOffer.title,
        description: "HARU 수강 신청 흐름 확인을 위한 테스트용 mock 과정입니다.",
        path: `/haru/classes/${encodeURIComponent(classId)}`,
        contentAvailable: false,
      });
    }
  }
  return createPageMetadata({
    title: item?.title ?? "교육 정보",
    description: item?.introduction ?? "공개가 확인된 HARU 교육 정보를 안내합니다.",
    path: `/haru/classes/${encodeURIComponent(classId)}`,
    contentAvailable: Boolean(item),
  });
}

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const item = await getPublicAcademyClassByIdForPage(classId);
  if (!item) {
    if (isMockEnrollmentAvailable()) {
      const mockOffer = (await getMockClassOffers()).offers.find((offer) => offer.id === classId);
      if (mockOffer) return <MockClassOfferDetail offer={mockOffer} />;
    }
    notFound();
  }

  const linkedInstructorIds = new Set(item.instructorIds);
  const instructors = getPublicInstructors().filter((instructor) => linkedInstructorIds.has(instructor.id));
  return <ClassDetail item={item} instructors={instructors} />;
}
