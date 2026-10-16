"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AcademyClass, ClassCategory, Instructor, RecruitmentStatus } from "@/types/content";
import { filterClasses } from "@/lib/filters";
import { classCategoryLabels, classCategoryOrder, getFirstClassSession, groupAcademyClassesByCategoryAndStartDate } from "@/lib/class-directory";
import { Button } from "@/components/ui/Button";
import { ContentImage } from "@/components/ui/ContentImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "./ClassDirectory.module.css";

interface ClassDirectoryProps {
  classes: readonly AcademyClass[];
  instructors: readonly Instructor[];
}

const statusLabels: Record<RecruitmentStatus, string> = {
  upcoming: "모집 예정", open: "모집 중", closed: "마감", completed: "종료",
};
const statusKinds = { upcoming: "upcoming", open: "open", closed: "closed", completed: "ended" } as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", weekday: "short",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", hour: "numeric", minute: "2-digit",
  }).format(new Date(value));
}

function formatTuition(amount: number): string {
  return amount === 0 ? "무료" : `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

export function ClassDirectory({ classes, instructors }: ClassDirectoryProps) {
  const [category, setCategory] = useState<ClassCategory | "">("");
  const [status, setStatus] = useState<RecruitmentStatus | "">("");
  const categories = classCategoryOrder.filter((value) => classes.some((item) => item.category === value));
  const statuses = (Object.keys(statusLabels) as RecruitmentStatus[]).filter((value) => classes.some((item) => item.recruitmentStatus === value));
  const instructorById = useMemo(() => new Map(instructors.map((instructor) => [instructor.id, instructor])), [instructors]);
  const filtered = filterClasses(classes, category, status);
  const groups = groupAcademyClassesByCategoryAndStartDate(filtered);
  const reset = () => { setCategory(""); setStatus(""); };

  return (
    <>
      {!classes.some((item) => item.recruitmentStatus === "open") ? (
        <p className={styles.notice} role="status">현재 신청 가능한 교육이 없습니다. 모집 예정·마감·종료 교육은 목록에서 확인할 수 있습니다.</p>
      ) : null}
      <div className={styles.toolbar}>
        <div className={styles.categoryFilters} role="group" aria-label="교육 분야 필터">
          <button className={styles.categoryFilter} aria-pressed={category === ""} onClick={() => setCategory("")} type="button">전체 분야</button>
          {categories.map((value) => (
            <button className={styles.categoryFilter} aria-pressed={category === value} key={value} onClick={() => setCategory(value)} type="button">{classCategoryLabels[value]}</button>
          ))}
        </div>
        <div className={styles.statusFilter}>
          <label className="srOnly" htmlFor="class-status">모집 상태</label>
          <select id="class-status" value={status} onChange={(event) => setStatus(event.target.value as RecruitmentStatus | "")}>
            <option value="">전체 모집 상태</option>
            {statuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
          </select>
          {category || status ? <Button type="button" variant="quiet" onClick={reset}>조건 초기화</Button> : null}
        </div>
      </div>
      <div className={styles.resultsBar}>
        <p aria-live="polite">총 <strong>{filtered.length}</strong>개 교육</p>
        <p>분야별 · 교육 시작일순</p>
      </div>
      {groups.length === 0 ? (
        <EmptyState kind="no-results" title="조건에 맞는 교육이 없습니다." description="다른 분야나 모집 상태를 선택하거나 조건을 초기화해 보세요." actionLabel="조건 초기화" onAction={reset} />
      ) : (
        <div className={styles.categoryGroups}>
          {groups.map((group) => (
            <section className={styles.categoryGroup} key={group.category} aria-labelledby={`class-category-${group.category}`}>
              <header className={styles.categoryHeading}>
                <div>
                  <p className={styles.categoryEyebrow}>{group.category.replaceAll("_", " ")}</p>
                  <h2 id={`class-category-${group.category}`}>{classCategoryLabels[group.category]}<span>{group.classes.length}개 교육</span></h2>
                </div>
                <span className={styles.orderLabel}>교육 시작일순</span>
              </header>
              <div className={styles.cardGrid}>
                {group.classes.map((item) => {
                  const firstSession = getFirstClassSession(item);
                  const teacherNames = [...new Set([
                    ...item.instructorIds.map((id) => instructorById.get(id)?.name).filter((name): name is string => Boolean(name)),
                    ...(item.instructorNames ?? []),
                  ])];
                  const locations = [...new Set(item.sessions.map((session) => session.location))];
                  const href = `/haru/classes/${encodeURIComponent(item.id)}`;
                  return (
                    <article className={styles.card} key={item.id}>
                      <ContentImage image={item.image} sizes="(max-width: 46rem) 100vw, (max-width: 64rem) 50vw, 33vw" />
                      <div className={styles.cardTopline}>
                        <span className={styles.courseCategory}>{classCategoryLabels[item.category]}</span>
                        <StatusBadge status={statusKinds[item.recruitmentStatus]} />
                      </div>
                      <h3 className={styles.cardTitle}><Link href={href}>{item.title}</Link></h3>
                      <p className={styles.summary}>{item.introduction}</p>
                      <div className={styles.schedule}>
                        <span className={styles.scheduleLabel}>교육 일정 <span>한국 시간</span></span>
                        {firstSession ? (
                          <>
                            <time className={styles.scheduleDate} dateTime={firstSession.startsAt}>{formatDate(firstSession.startsAt)}</time>
                            <span className={styles.scheduleTime}>{formatTime(firstSession.startsAt)} – {formatTime(firstSession.endsAt)}{item.sessions.length > 1 ? ` · 총 ${item.sessions.length}회` : ""}</span>
                          </>
                        ) : <span className={styles.scheduleDate}>일정 확인 중</span>}
                      </div>
                      <dl className={styles.meta}>
                        <div><dt>강사</dt><dd>{teacherNames.length > 0 ? teacherNames.join(", ") : "강사 정보 준비 중"}</dd></div>
                        <div><dt>장소</dt><dd>{locations.join(" · ") || "장소 확인 중"}</dd></div>
                      </dl>
                      <footer className={styles.cardFooter}>
                        <div><span className={styles.priceLabel}>교육비</span><p className={styles.price}>{formatTuition(item.tuition.amount)}</p></div>
                        <Link className={styles.detailLink} href={href} aria-label={`${item.title} 교육 상세 보기`}>상세 보기 <span aria-hidden="true">↗</span></Link>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
