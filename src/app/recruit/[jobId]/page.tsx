import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ExternalLinkNotice } from "@/components/ui/ExternalLinkNotice";
import { RelatedListLink } from "@/components/ui/RelatedListLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimeBoundAction } from "@/components/ui/TimeBoundAction";
import { getPublicJobById } from "@/content/queries";
import { getSalonDirectoryData } from "@/content/local-branches";
import { getJobApplicationAvailability, isValidExternalUrl } from "@/lib/actions";
import { createPageMetadata } from "@/lib/seo";
import type { RecruitmentStatus } from "@/types/content";
import styles from "@/app/content-pages.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ jobId: string }> }): Promise<Metadata> {
  const { jobId } = await params;
  const job = getPublicJobById(jobId);
  const { branches } = await getSalonDirectoryData();
  const branch = job ? branches.find((item) => item.id === job.branchId) : undefined;
  const publishedJob = job && branch ? job : undefined;
  return createPageMetadata({
    title: publishedJob?.title ?? "채용 정보",
    description: publishedJob && branch
      ? `${branch.officialName} · ${publishedJob.role} 채용 공고와 지원 정보를 확인할 수 있습니다.`
      : "공개가 확인된 MAY.ONE 채용 공고를 안내합니다.",
    path: `/recruit/${encodeURIComponent(jobId)}`,
    contentAvailable: Boolean(publishedJob),
  });
}

const statusLabel: Record<RecruitmentStatus, string> = {
  upcoming: "모집 예정",
  open: "모집 중",
  closed: "마감",
  completed: "종료",
};

const statusKind = {
  upcoming: "upcoming",
  open: "open",
  closed: "closed",
  completed: "ended",
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

function blockedReason(reason: string | undefined): string {
  switch (reason) {
    case "not-open": return "현재 모집 중인 공고가 아닙니다.";
    case "missing-url":
    case "invalid-url": return "공식 지원 경로를 준비하고 있습니다.";
    case "incomplete": return "지원에 필요한 정보를 확인하고 있습니다.";
    case "deadline-passed": return "지원 기간이 종료되었습니다.";
    default: return "지원 정보를 확인할 수 없습니다.";
  }
}

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = getPublicJobById(jobId);
  if (!job) notFound();
  const { branches } = await getSalonDirectoryData();
  const branch = branches.find((item) => item.id === job.branchId);
  if (!branch) notFound();

  const application = getJobApplicationAvailability(job, new Date(0));
  const inquiryUrl = isValidExternalUrl(job.inquiryUrl) ? job.inquiryUrl : undefined;

  return (
    <div className={styles.page}>
      <SectionHeading eyebrow="CAREER · JOB DETAIL" title={job.title} description={`${branch.officialName} · ${job.role}`} />
      <div className={styles.badgeRow}><StatusBadge status={statusKind[job.recruitmentStatus]} label={statusLabel[job.recruitmentStatus]} /></div>

      <section className={styles.section} aria-labelledby="job-duties-title">
        <h2 className={styles.sectionTitle} id="job-duties-title">주요 업무</h2>
        <ul className={styles.plainList}>{job.duties.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className={styles.section} aria-labelledby="job-qualifications-title">
        <h2 className={styles.sectionTitle} id="job-qualifications-title">지원 자격</h2>
        <ul className={styles.plainList}>{job.qualifications.map((item) => <li key={item}>{item}</li>)}</ul>
        {job.preferredQualifications?.length ? (
          <>
            <h3 className={styles.sectionTitle}>우대 사항</h3>
            <ul className={styles.plainList}>{job.preferredQualifications.map((item) => <li key={item}>{item}</li>)}</ul>
          </>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="job-conditions-title">
        <h2 className={styles.sectionTitle} id="job-conditions-title">근무지와 조건</h2>
        <dl className={styles.infoGrid}>
          <dt>지점</dt><dd>{branch.officialName}</dd>
          <dt>주소</dt><dd>{branch.address}</dd>
          <dt>직무</dt><dd>{job.role}</dd>
          <dt>경력</dt><dd>{job.experience}</dd>
          <dt>근무 조건</dt><dd>{job.workingConditions}</dd>
          <dt>급여 안내</dt><dd>{job.salaryGuide}</dd>
          <dt>모집 마감</dt><dd>{job.deadlineAt ? formatDate(job.deadlineAt) + " (한국 시간)" : job.recruitmentStatus === "open" ? "상시 모집" : "별도 안내 없음"}</dd>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="job-process-title">
        <h2 className={styles.sectionTitle} id="job-process-title">전형 절차와 제출 자료</h2>
        <div className={styles.splitGrid}>
          <div>
            <h3 className={styles.flowName}>전형 절차</h3>
            <ol className={styles.plainList}>{job.process.map((step) => <li key={step}>{step}</li>)}</ol>
          </div>
          <div>
            <h3 className={styles.flowName}>제출 자료</h3>
            <ul className={styles.plainList}>{job.requiredDocuments.map((document) => <li key={document}>{document}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="job-apply-title">
        <h2 className={styles.sectionTitle} id="job-apply-title">지원과 문의</h2>
        <p className={styles.sectionLead}>지원 접수와 결과 안내는 공고에 연결된 공식 채널에서 확인해 주세요.</p>
        <div className={styles.cardActions}>
          <TimeBoundAction
            eligible={application.enabled}
            href={application.href}
            expiresAt={job.deadlineAt}
            label="공식 지원 페이지로 이동"
            disabledReason={blockedReason(application.reason)}
          />
          {inquiryUrl ? <ButtonLink href={inquiryUrl} external variant="secondary">채용 문의</ButtonLink> : <Button disabled variant="secondary">문의 채널 준비 중</Button>}
          <RelatedListLink href="/recruit">채용 목록</RelatedListLink>
        </div>
        {(application.enabled || inquiryUrl) ? <ExternalLinkNotice>선택하면 공고의 공식 외부 채널이 새 탭에서 열립니다.</ExternalLinkNotice> : null}
      </section>
    </div>
  );
}
