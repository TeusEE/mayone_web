"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AcademyClass, ClassCategory, Instructor, RecruitmentStatus } from "@/types/content";
import { filterClasses } from "@/lib/filters";
import { Button } from "@/components/ui/Button";
import { ContentImage } from "@/components/ui/ContentImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect } from "@/components/ui/FilterFields";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "@/app/content-pages.module.css";

interface ClassDirectoryProps {
  classes: readonly AcademyClass[];
  instructors: readonly Instructor[];
}

const categoryLabels: Record<ClassCategory, string> = {
  CUT: "커트",
  PERM: "펌",
  COLOR: "컬러",
  CONSULTING: "디자인 상담",
  SALON_WORK: "살롱 실무",
};

const statusLabels: Record<RecruitmentStatus, string> = {
  upcoming: "모집 예정",
  open: "모집 중",
  closed: "마감",
  completed: "종료",
};

const statusKinds = {
  upcoming: "upcoming",
  open: "open",
  closed: "closed",
  completed: "ended",
} as const;

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "일정 확인 중";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatTuition(amount: number): string {
  if (amount === 0) return "무료";
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(amount);
}

export function ClassDirectory({ classes, instructors }: ClassDirectoryProps) {
  const [category, setCategory] = useState<ClassCategory | "">("");
  const [status, setStatus] = useState<RecruitmentStatus | "">("");
  const categoryOptions = useMemo(
    () => [...new Set(classes.map((item) => item.category))].map((value) => ({ label: categoryLabels[value], value })),
    [classes],
  );
  const statuses = useMemo(() => [...new Set(classes.map((item) => item.recruitmentStatus))], [classes]);
  const instructorById = useMemo(() => new Map(instructors.map((instructor) => [instructor.id, instructor])), [instructors]);
  const filtered = filterClasses(classes, category, status);
  const reset = () => {
    setCategory("");
    setStatus("");
  };

  return (
    <>
      {!classes.some((item) => item.recruitmentStatus === "open") ? (
        <p className={styles.resultsLine} role="status">현재 신청 가능한 교육이 없습니다. 모집 예정·마감·종료 교육은 목록에서 상태와 함께 확인할 수 있습니다.</p>
      ) : null}
      <div className={styles.filters} role="group" aria-label="교육 분야와 모집 상태 필터">
        <FilterSelect
          id="class-category"
          label="교육 분야"
          value={category}
          onChange={(event) => setCategory(event.target.value as ClassCategory | "")}
          options={[{ label: "전체 분야", value: "" }, ...categoryOptions]}
        />
        <FilterSelect
          id="class-status"
          label="모집 상태"
          value={status}
          onChange={(event) => setStatus(event.target.value as RecruitmentStatus | "")}
          options={[{ label: "전체 상태", value: "" }, ...statuses.map((value) => ({ label: statusLabels[value], value }))]}
        />
        <Button type="button" variant="secondary" onClick={reset}>조건 초기화</Button>
      </div>

      <p className={styles.resultsLine} aria-live="polite">검색 결과 {filtered.length}개</p>
      {filtered.length === 0 ? (
        <EmptyState
          kind="no-results"
          title="조건에 맞는 교육이 없습니다."
          description="다른 분야나 모집 상태를 선택하거나 조건을 초기화해 보세요."
          actionLabel="조건 초기화"
          onAction={reset}
        />
      ) : (
        <div className={styles.cardGrid}>
          {filtered.map((item) => {
            const teacherNames = [...new Set([
              ...item.instructorIds.map((id) => instructorById.get(id)?.name).filter((name): name is string => Boolean(name)),
              ...(item.instructorNames ?? []),
            ])];
            const locations = [...new Set(item.sessions.map((session) => session.location))];
            return (
              <article className={styles.card} key={item.id}>
                <ContentImage image={item.image} sizes="(max-width: 44rem) 100vw, 33vw" />
                <h2 className={styles.cardTitle}><Link href={`/haru/classes/${item.id}`}>{item.title}</Link></h2>
                <div className={styles.badgeRow}>
                  <StatusBadge status={statusKinds[item.recruitmentStatus]} />
                  <span>{categoryLabels[item.category]}</span>
                </div>
                <ul className={styles.cardMeta}>
                  <li>강사: {teacherNames.length > 0 ? teacherNames.join(", ") : "강사 정보 준비 중"}</li>
                  <li>대상: {item.audience.join(" · ")}</li>
                  <li>일정: {item.sessions.map((session) => formatDate(session.startsAt)).join(" · ")}</li>
                  <li>장소: {locations.join(" · ")}</li>
                  <li>교육비: {formatTuition(item.tuition.amount)}</li>
                </ul>
                <div className={styles.cardActions}><Link className={styles.textLink} href={`/haru/classes/${item.id}`}>교육 상세 보기</Link></div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
