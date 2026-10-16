import { notFound } from "next/navigation";
import { ClassDirectory } from "@/components/haru/ClassDirectory";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { AcademyClass } from "@/types/content";
import styles from "@/app/content-pages.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "교육 목록 디자인 미리보기",
  robots: { index: false, follow: false },
};

const examples = [
  { id: "cut-late", title: "롱 하이레이어드", category: "CUT", day: "2026-11-03", price: 50000, status: "open" },
  { id: "salon", title: "미용실 업세일즈 실전 교육", category: "SALON_WORK", day: "2026-11-23", price: 70000, status: "open" },
  { id: "cut-first", title: "투섹션 레이어드컷", category: "CUT", day: "2026-10-27", price: 100000, status: "open" },
  { id: "perm", title: "레이어드컷 & 허쉬무드펌 마스터 클래스", category: "PERM", day: "2026-11-02", price: 100000, status: "open" },
  { id: "cut-last", title: "레쟈 텍스쳐컷", category: "CUT", day: "2026-11-04", price: 50000, status: "closed" },
  { id: "color", title: "살롱 컬러 디자인", category: "COLOR", day: "2026-11-06", price: 0, status: "upcoming" },
  { id: "consulting", title: "고객 맞춤 디자인 상담", category: "CONSULTING", day: "2026-11-07", price: 50000, status: "completed" },
] as const;

export default function ClassDirectoryPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const classes: AcademyClass[] = examples.map((item) => ({
    id: `preview-${item.id}`,
    title: item.title,
    category: item.category,
    recruitmentStatus: item.status,
    publicationState: "draft",
    reviewState: "pending",
    instructorIds: [],
    instructorNames: ["샘플 강사"],
    introduction: "디자인 원리부터 살롱에서 활용할 수 있는 실전 테크닉까지 함께 배우는 샘플 교육입니다. 긴 소개는 두 줄로 표시되며 일정과 교육비를 빠르게 비교할 수 있습니다.",
    audience: ["디자인 검토용 샘플"],
    curriculum: ["이론", "실습"],
    sessions: [{ startsAt: `${item.day}T19:00:00+09:00`, endsAt: `${item.day}T21:00:00+09:00`, timeZone: "Asia/Seoul", location: "샘플 교육장" }],
    tuition: { amount: item.price, currency: "KRW", includes: [] },
    cancellationPolicy: "디자인 검토용 샘플",
  }));

  return (
    <div className={styles.page}>
      <aside className={styles.previewNotice} role="note">개발 전용 디자인 미리보기입니다. 강사·일정·장소·교육비는 샘플이며 실제 교육 정보가 아닙니다. 분야별 분류·날짜 정렬·필터를 확인할 수 있으며, 샘플의 상세 페이지는 제공하지 않습니다.</aside>
      <SectionHeading eyebrow="HARU · CLASS" title="HARU 교육 일정" description="공개가 확인된 교육의 분야와 모집 상태, 일정과 비용을 안내합니다." />
      <ClassDirectory classes={classes} instructors={[]} />
    </div>
  );
}
