import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ContentImage } from "@/components/ui/ContentImage";
import { RelatedListLink } from "@/components/ui/RelatedListLink";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimeBoundAction } from "@/components/ui/TimeBoundAction";
import { getClassApplicationAvailability } from "@/lib/actions";
import { getPublicClassById, getPublicClasses, getPublicInstructors } from "@/content/queries";
import { createPageMetadata } from "@/lib/seo";
import type { RecruitmentStatus } from "@/types/content";
import styles from "@/app/content-pages.module.css";

export function generateStaticParams() {
  return getPublicClasses().map((item) => ({ classId: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ classId: string }> }): Promise<Metadata> {
  const { classId } = await params;
  const item = getPublicClassById(classId);
  return createPageMetadata({
    title: item?.title ?? "교육 정보",
    description: item?.introduction ?? "공개가 확인된 HARU 교육 정보를 안내합니다.",
    path: `/haru/classes/${encodeURIComponent(classId)}`,
    contentAvailable: Boolean(item),
  });
}

const statusText: Record<RecruitmentStatus, string> = {
  upcoming: "모집 예정",
  open: "모집 중",
  closed: "마감",
  completed: "종료",
};

const statusStyle = {
  upcoming: "upcoming",
  open: "open",
  closed: "closed",
  completed: "ended",
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPrice(amount: number): string {
  return amount === 0
    ? "무료"
    : new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(amount);
}

function blockedReason(reason: string | undefined): string {
  switch (reason) {
    case "not-open": return "현재 모집 중인 교육이 아닙니다.";
    case "missing-url":
    case "invalid-url": return "공식 신청 경로를 준비하고 있습니다.";
    case "incomplete": return "신청에 필요한 정보를 확인하고 있습니다.";
    case "deadline-passed": return "신청 기간이 종료되었습니다.";
    default: return "신청 정보를 확인할 수 없습니다.";
  }
}

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const item = getPublicClassById(classId);
  if (!item) notFound();

  const linkedInstructorIds = new Set(item.instructorIds);
  const instructors = getPublicInstructors().filter((instructor) => linkedInstructorIds.has(instructor.id));
  const application = getClassApplicationAvailability(item, new Date(0));
  const sessionEnd = item.sessions.reduce((latest, session) => Math.max(latest, Date.parse(session.endsAt)), 0);
  const deadline = item.deadlineAt ? Date.parse(item.deadlineAt) : Number.POSITIVE_INFINITY;
  const expiresAt = Number.isFinite(Math.min(sessionEnd, deadline)) ? new Date(Math.min(sessionEnd, deadline)).toISOString() : undefined;

  return (
    <div className={styles.page}>
      <div className={styles.detailHero}>
        <ContentImage image={item.image} sizes="(max-width: 44rem) 100vw, 40vw" preload />
        <div>
          <p className="sectionEyebrow">HARU · CLASS DETAIL · {item.category}</p>
          <h1 className={styles.detailTitle}>{item.title}</h1>
          <div className={styles.badgeRow}><StatusBadge status={statusStyle[item.recruitmentStatus]} label={statusText[item.recruitmentStatus]} /></div>
          <div className={styles.bodyCopy}><p>{item.introduction}</p></div>
        </div>
      </div>

      <section className={styles.section} aria-labelledby="class-instructors-title">
        <h2 className={styles.sectionTitle} id="class-instructors-title">강사</h2>
        {instructors.length > 0 ? (
          <div className={styles.cardGrid}>
            {instructors.map((instructor) => (
              <article className={styles.card} key={instructor.id}>
                <ContentImage image={instructor.profileImage} sizes="(max-width: 44rem) 100vw, 25vw" />
                <h3 className={styles.cardTitle}>{instructor.name}</h3>
                <p className={styles.muted}>{instructor.title}</p>
                <p className={styles.muted}>{instructor.introduction}</p>
                <ul className={styles.cardMeta}>{instructor.specialties.map((specialty) => <li key={specialty}>{specialty}</li>)}</ul>
                {instructor.career?.length ? <ul className={styles.cardMeta}>{instructor.career.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              </article>
            ))}
          </div>
        ) : <p className={styles.muted}>강사 정보를 준비하고 있습니다.</p>}
      </section>

      <section className={styles.section} aria-labelledby="class-content-title">
        <h2 className={styles.sectionTitle} id="class-content-title">교육 내용과 대상</h2>
        <p className={styles.sectionLead}>{item.introduction}</p>
        <dl className={styles.infoGrid}>
          <dt>교육 대상</dt><dd>{item.audience.join(" · ")}</dd>
          <dt>커리큘럼</dt><dd><ul className={styles.plainList}>{item.curriculum.map((step) => <li key={step}>{step}</li>)}</ul></dd>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="class-schedule-title">
        <h2 className={styles.sectionTitle} id="class-schedule-title">일정과 장소</h2>
        <div className={styles.cardGrid}>
          {item.sessions.map((session, index) => (
            <article className={styles.card} key={`${session.startsAt}-${index}`}>
              <h3 className={styles.cardTitle}>{index + 1}회차</h3>
              <p className={styles.muted}>{formatDate(session.startsAt)} – {formatDate(session.endsAt)} (한국 시간)</p>
              <p className={styles.muted}>{session.location}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="class-tuition-title">
        <h2 className={styles.sectionTitle} id="class-tuition-title">교육비와 준비물</h2>
        <dl className={styles.infoGrid}>
          <dt>교육비</dt><dd>{formatPrice(item.tuition.amount)}</dd>
          {item.tuition.includes.length ? <><dt>포함 내역</dt><dd>{item.tuition.includes.join(" · ")}</dd></> : null}
          {item.tuition.materials?.length ? <><dt>준비물</dt><dd>{item.tuition.materials.join(" · ")}</dd></> : null}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="class-application-title">
        <h2 className={styles.sectionTitle} id="class-application-title">신청과 취소 안내</h2>
        <dl className={styles.infoGrid}>
          <dt>모집 상태</dt><dd>{statusText[item.recruitmentStatus]}</dd>
          {item.deadlineAt ? <><dt>신청 마감</dt><dd>{formatDate(item.deadlineAt)} (한국 시간)</dd></> : null}
          <dt>취소 안내</dt><dd>{item.cancellationPolicy}</dd>
        </dl>
        <div className={styles.cardActions}>
          <TimeBoundAction
            eligible={application.enabled}
            href={application.href}
            expiresAt={expiresAt}
            label="공식 신청 페이지로 이동"
            disabledReason={blockedReason(application.reason)}
          />
          <RelatedListLink href="/haru/classes">교육 목록</RelatedListLink>
        </div>
        {application.enabled ? <p className={styles.actionNote}>신청 접수 여부와 잔여 정원은 외부 공식 신청 페이지에서 확인해 주세요.</p> : null}
      </section>
    </div>
  );
}
