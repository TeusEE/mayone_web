import Link from "next/link";
import { ContentImage } from "@/components/ui/ContentImage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimeBoundAction } from "@/components/ui/TimeBoundAction";
import { getClassApplicationAvailability } from "@/lib/actions";
import { classCategoryLabels } from "@/lib/class-directory";
import type { AcademyClass, Instructor, RecruitmentStatus } from "@/types/content";
import styles from "./ClassDetail.module.css";

interface ClassDetailProps {
  item: AcademyClass;
  instructors: readonly Instructor[];
}

const statusText: Record<RecruitmentStatus, string> = {
  upcoming: "모집 예정", open: "모집 중", closed: "마감", completed: "종료",
};
const statusStyle = { upcoming: "upcoming", open: "open", closed: "closed", completed: "ended" } as const;

function formatDate(value: string, compact = false): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    ...(compact ? { year: "numeric", month: "numeric", day: "numeric" } as const
      : { year: "numeric", month: "long", day: "numeric", weekday: "short" } as const),
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", hour: "numeric", minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(amount: number): string {
  return amount === 0 ? "무료" : `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
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

function paragraphs(value: string) {
  return value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

export function ClassDetail({ item, instructors }: ClassDetailProps) {
  const isDevelopmentSample = process.env.VERCEL_ENV !== "production" && item.id.startsWith("dev-sample-");
  const sessions = [...item.sessions].sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt));
  const firstSession = sessions[0];
  const lastSession = sessions.at(-1);
  const teacherNames = [...new Set([...instructors.map((instructor) => instructor.name), ...(item.instructorNames ?? [])])];
  const locations = [...new Set(sessions.map((session) => session.location))];
  const application = getClassApplicationAvailability(item, new Date(0));
  const sessionEnd = sessions.reduce((latest, session) => Math.max(latest, Date.parse(session.endsAt)), 0);
  const deadline = item.deadlineAt ? Date.parse(item.deadlineAt) : Infinity;
  const cutoff = Math.min(sessionEnd, deadline);
  const expiresAt = Number.isFinite(cutoff) ? new Date(cutoff).toISOString() : undefined;
  const applicationAction = <TimeBoundAction
    eligible={!isDevelopmentSample && application.enabled}
    href={application.href}
    expiresAt={expiresAt}
    label="수강 신청하기"
    disabledReason={isDevelopmentSample ? "개발 샘플 · 신청 불가" : blockedReason(application.reason)}
  />;

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="교육 페이지 경로">
        <Link href="/haru/classes"><span aria-hidden="true">←</span> 교육 목록</Link>
        <span aria-hidden="true">/</span><span>{classCategoryLabels[item.category]}</span>
      </nav>
      {isDevelopmentSample ? (
        <aside className={styles.previewNotice} role="note">개발 검수용 샘플입니다. 운영 공개 교육을 복사한 자료이며 실제 수강 신청은 제공하지 않습니다.</aside>
      ) : null}

      <div className={styles.layout}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>HARU ACADEMY · {item.category.replaceAll("_", " ")}</p>
          <div className={styles.badges}>
            <span className={styles.category}>{classCategoryLabels[item.category]}</span>
            <StatusBadge status={statusStyle[item.recruitmentStatus]} label={statusText[item.recruitmentStatus]} />
          </div>
          <h1 className={styles.title}>{item.title}</h1>
          <p className={styles.teacherLine}><span>강사</span> {teacherNames.length ? teacherNames.join(" · ") : "강사 정보 준비 중"}</p>
        </header>

        <aside className={styles.summaryRail} aria-labelledby="class-summary-title">
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle} id="class-summary-title">수강 안내</h2>
            <div className={styles.priceBlock}>
              <span>전체 교육비</span>
              <p className={styles.price}>{formatPrice(item.tuition.amount)}</p>
              {sessions.length > 1 ? <p className={styles.priceNote}>총 {sessions.length}회 과정</p> : null}
            </div>
            <dl className={styles.summaryInfo}>
              <div><dt>교육 일정</dt><dd>{firstSession ? <>
                <time dateTime={firstSession.startsAt}>{formatDate(firstSession.startsAt, true)}</time>
                {lastSession && formatDate(lastSession.startsAt, true) !== formatDate(firstSession.startsAt, true) ? <> – <time dateTime={lastSession.startsAt}>{formatDate(lastSession.startsAt, true)}</time></> : null}
                <span className={styles.summarySubline}>{formatTime(firstSession.startsAt)} 시작 · 한국 시간</span>
              </> : "일정 확인 중"}</dd></div>
              <div><dt>교육 장소</dt><dd>{locations.join(" · ") || "장소 확인 중"}</dd></div>
              {item.deadlineAt ? <div><dt>신청 마감</dt><dd><time dateTime={item.deadlineAt}>{formatDate(item.deadlineAt, true)}<span className={styles.summarySubline}>{formatTime(item.deadlineAt)} · 한국 시간</span></time></dd></div> : null}
            </dl>
            <div className={styles.applicationAction}>
              {applicationAction}
            </div>
            <p className={styles.applicationNote}>{isDevelopmentSample
              ? "화면 확인을 위한 개발 샘플입니다."
              : application.enabled ? "공식 신청 페이지에서 접수 여부와 잔여 정원을 확인해 주세요. 새 탭으로 연결됩니다."
                : "모집 상태와 신청 안내를 확인해 주세요."}</p>
            <a className={styles.policyLink} href="#class-policy">신청·취소 안내 확인 <span aria-hidden="true">↓</span></a>
          </div>
        </aside>

        <div className={styles.content}>
          <nav className={styles.sectionNav} aria-label="교육 상세 바로가기">
            <a href="#class-introduction">교육 소개</a>
            <a href="#class-curriculum">커리큘럼</a>
            <a href="#class-schedule">일정·장소</a>
            <a href="#class-tuition">비용·준비물</a>
            <a href="#class-policy">신청·취소 안내</a>
          </nav>
          <ContentImage image={item.image} sizes="(max-width: 58rem) 100vw, 60vw" preload />

          <section className={styles.section} id="class-introduction" aria-labelledby="class-introduction-title">
            <h2 className={styles.sectionTitle} id="class-introduction-title">교육 소개</h2>
            <div className={styles.prose}>{paragraphs(item.introduction).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          </section>

          <section className={styles.section} aria-labelledby="class-audience-title">
            <h2 className={styles.sectionTitle} id="class-audience-title">이런 분께 추천합니다</h2>
            <ul className={styles.bulletList}>{item.audience.map((audience, index) => <li key={index}>{audience}</li>)}</ul>
          </section>

          <section className={styles.section} id="class-curriculum" aria-labelledby="class-curriculum-title">
            <h2 className={styles.sectionTitle} id="class-curriculum-title">커리큘럼</h2>
            <ul className={styles.curriculumList}>{item.curriculum.map((step, index) => (
              <li className={/^\[[^\]]+\]/u.test(step) ? styles.curriculumHeading : undefined} key={index}>
                {/^\[[^\]]+\]/u.test(step) ? <h3>{step}</h3> : step}
              </li>
            ))}</ul>
          </section>

          {instructors.length > 0 ? <section className={styles.section} aria-labelledby="class-instructors-title">
            <h2 className={styles.sectionTitle} id="class-instructors-title">강사 소개</h2>
            <div className={styles.instructors}>{instructors.map((instructor) => (
              <article className={styles.instructor} key={instructor.id}>
                <ContentImage image={instructor.profileImage} sizes="(max-width: 58rem) 100vw, 25vw" />
                <h3>{instructor.name}<span>{instructor.title}</span></h3>
                <div className={styles.prose}>{paragraphs(instructor.introduction).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
                {instructor.specialties.length ? <p className={styles.specialties}>{instructor.specialties.join(" · ")}</p> : null}
                {instructor.career?.length ? <ul className={styles.bulletList}>{instructor.career.map((career, index) => <li key={index}>{career}</li>)}</ul> : null}
              </article>
            ))}</div>
          </section> : null}

          <section className={styles.section} id="class-schedule" aria-labelledby="class-schedule-title">
            <h2 className={styles.sectionTitle} id="class-schedule-title">일정과 장소</h2>
            <p className={styles.sectionNote}>전체 {sessions.length}회 · 모든 일정은 한국 시간 기준입니다.</p>
            <ol className={styles.sessions}>{sessions.map((session, index) => {
              const sameDay = formatDate(session.startsAt, true) === formatDate(session.endsAt, true);
              return <li className={styles.session} key={`${session.startsAt}-${index}`}>
                <span className={styles.sessionIndex} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{index + 1}회차</h3>
                  <p className={styles.sessionDate}><time dateTime={session.startsAt}>{formatDate(session.startsAt)}</time></p>
                  <p className={styles.sessionTime}>{formatTime(session.startsAt)} – {sameDay ? "" : `${formatDate(session.endsAt)} `}{formatTime(session.endsAt)}</p>
                  <p className={styles.sessionLocation}>{session.location}</p>
                </div>
              </li>;
            })}</ol>
          </section>

          <section className={styles.section} id="class-tuition" aria-labelledby="class-tuition-title">
            <h2 className={styles.sectionTitle} id="class-tuition-title">교육비와 준비물</h2>
            <div className={styles.tuitionTotal}><span>전체 교육비{sessions.length > 1 ? ` · 총 ${sessions.length}회` : ""}</span><strong>{formatPrice(item.tuition.amount)}</strong></div>
            <div className={styles.costColumns}>
              {item.tuition.includes.length ? <div><h3>포함 내역</h3><ul className={styles.bulletList}>{item.tuition.includes.map((included, index) => <li key={index}>{included}</li>)}</ul></div> : null}
              {item.tuition.materials?.length ? <div><h3>준비물</h3><ul className={styles.bulletList}>{item.tuition.materials.map((material, index) => <li key={index}>{material}</li>)}</ul></div> : null}
            </div>
          </section>

          <section className={styles.section} id="class-policy" aria-labelledby="class-policy-title">
            <h2 className={styles.sectionTitle} id="class-policy-title">신청과 취소 안내</h2>
            {item.deadlineAt ? <p className={styles.deadline}><span>신청 마감</span><time dateTime={item.deadlineAt}>{formatDate(item.deadlineAt)} {formatTime(item.deadlineAt)} (한국 시간)</time></p> : null}
            <div className={styles.policyCopy}>{paragraphs(item.cancellationPolicy).map((paragraph, index) => (
              <p className={/^\[[^\]]+\]$/u.test(paragraph) ? styles.policyHeading : undefined} key={index}>{paragraph}</p>
            ))}</div>
          </section>
          <footer className={styles.backToList}>
            <div className={styles.mobileApplication}>{applicationAction}</div>
            <Link href="/haru/classes"><span aria-hidden="true">←</span> 전체 교육 목록으로</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
