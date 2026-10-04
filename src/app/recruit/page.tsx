import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getBrandCopyForDevelopmentReview, getJobCollectionState, getPublicJobs } from "@/content/queries";
import { getSalonDirectoryData } from "@/content/local-branches";
import { createPageMetadata } from "@/lib/seo";
import type { RecruitmentStatus } from "@/types/content";
import styles from "@/app/content-pages.module.css";

const statusLabel: Record<RecruitmentStatus, string> = {
  upcoming: "모집 예정",
  open: "모집 중",
  closed: "마감",
  completed: "종료",
};

export const dynamic = "force-dynamic";

const statusKind = {
  upcoming: "upcoming",
  open: "open",
  closed: "closed",
  completed: "ended",
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long" }).format(new Date(value));
}

export async function generateMetadata() {
  const { branches } = await getSalonDirectoryData();
  const branchIds = new Set(branches.map((branch) => branch.id));
  return createPageMetadata({
    title: "MAY.ONE 채용",
    description: "확인된 MAY.ONE 채용 공고의 지점, 근무 조건과 지원 정보를 안내합니다.",
    path: "/recruit",
    contentAvailable: getPublicJobs().some((job) => branchIds.has(job.branchId)),
  });
}

export default async function RecruitPage() {
  const brand = getBrandCopyForDevelopmentReview();
  const state = getJobCollectionState();
  const directory = await getSalonDirectoryData();
  const branches = new Map(directory.branches.map((branch) => [branch.id, branch]));
  const jobs = getPublicJobs().filter((job) => branches.has(job.branchId));
  const preview = Boolean(brand && (brand.publicationState !== "published" || brand.reviewState !== "confirmed"));

  return (
    <div className={styles.page}>
      <SectionHeading
        eyebrow={brand?.home.recruit.eyebrow ?? "GROW WITH MAY.ONE"}
        title={brand?.home.recruit.title ?? "MAY.ONE 채용"}
        description={brand?.home.recruit.description ?? "확인된 MAY.ONE 채용 공고와 지원 정보를 안내합니다."}
      />
      {preview ? <p className={styles.previewNotice} role="status">개발 검수용 미승인 브랜드 원고 미리보기 · 실제 채용 공고는 확정된 정보만 공개합니다.</p> : null}

      {brand ? (
        <section className={styles.section} aria-labelledby="recruit-path-title">
          <h2 className={styles.sectionTitle} id="recruit-path-title">성장 경로</h2>
          <div className={styles.flowGrid}>
            {brand.recruitPath.map((stage) => (
              <article className={styles.flowItem} key={stage}>
                <h3 className={styles.flowName}>{stage}</h3>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="recruit-list-title">
        <h2 className={styles.sectionTitle} id="recruit-list-title">채용 공고</h2>
        {jobs.length > 0 ? (
          <div className={styles.cardGrid}>
            {jobs.map((job) => (
              <article className={styles.card} key={job.id}>
                <div className={styles.badgeRow}><StatusBadge status={statusKind[job.recruitmentStatus]} label={statusLabel[job.recruitmentStatus]} /></div>
                <h3 className={styles.cardTitle}><Link href={`/recruit/${job.id}`}>{job.title}</Link></h3>
                <ul className={styles.cardMeta}>
                  <li>지점: {branches.get(job.branchId)?.officialName ?? "지점 정보 확인 중"}</li>
                  <li>직무: {job.role}</li>
                  <li>경력: {job.experience}</li>
                  <li>마감: {job.deadlineAt ? formatDate(job.deadlineAt) : job.recruitmentStatus === "open" ? "상시 모집" : "마감일 미정"}</li>
                </ul>
                <Link className={styles.textLink} href={`/recruit/${job.id}`}>공고 상세 보기</Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            kind={state === "preparing" ? "preparing" : "empty"}
            title={state === "preparing" ? "채용 정보를 준비하고 있습니다." : "현재 등록된 채용공고가 없습니다."}
            description={state === "preparing" ? "지점과 직무, 근무 조건 및 공식 지원 경로를 확인한 뒤 안내하겠습니다." : "확정된 채용 공고가 등록되면 이곳에서 안내합니다."}
          />
        )}
      </section>
    </div>
  );
}
