"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AcademyClass, ClassCategory, PublicationState, RecruitmentStatus } from "@/types/content";
import { academyClassToAdminInput, type AdminAcademyClassInput } from "@/lib/admin-academy-class-input";
import styles from "./MockClassOfferManager.module.css";

interface ApiResult {
  message?: string;
  errors?: string[];
}

const categories: [ClassCategory, string][] = [
  ["CUT", "커트"], ["PERM", "펌"], ["COLOR", "컬러"], ["CONSULTING", "디자인 상담"], ["SALON_WORK", "살롱 실무"],
];
const publicationOptions: [PublicationState, string][] = [["draft", "초안 · 비공개"], ["published", "공개"]];
const recruitmentOptions: [RecruitmentStatus, string][] = [
  ["upcoming", "모집 예정"], ["open", "모집 중"], ["closed", "마감"], ["completed", "종료"],
];
const categoryLabels = Object.fromEntries(categories) as Record<ClassCategory, string>;
const statusLabels = Object.fromEntries(recruitmentOptions) as Record<RecruitmentStatus, string>;

function emptyForm(): AdminAcademyClassInput {
  return {
    title: "",
    category: "CUT",
    publicationState: "draft",
    recruitmentStatus: "upcoming",
    instructorNamesText: "",
    instructorIdsText: "",
    introduction: "",
    audienceText: "",
    curriculumText: "",
    sessionsText: "",
    tuitionAmount: "0",
    tuitionIncludesText: "",
    tuitionMaterialsText: "",
    cancellationPolicy: "",
    applicationUrl: "",
    deadlineAt: "",
  };
}

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }).format(date)
    : "일정 확인 중";
}

function moneyLabel(value: number): string {
  return value === 0 ? "무료" : new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);
}

export function AcademyClassManager({ classes }: { classes: readonly AcademyClass[] }) {
  const router = useRouter();
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [values, setValues] = useState<AdminAcademyClassInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  function openCreateForm() {
    setValues(emptyForm());
    setEditingClassId("new");
    setMessage("");
  }

  function openEditForm(item: AcademyClass) {
    setValues(academyClassToAdminInput(item));
    setEditingClassId(item.id);
    setMessage("");
  }

  function updateField<K extends keyof AdminAcademyClassInput>(field: K, value: AdminAcademyClassInput[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function saveClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingClassId) return;
    setSaving(true);
    setMessage("");
    const isCreating = editingClassId === "new";
    try {
      const response = await fetch(isCreating ? "/api/classes" : `/api/classes/${encodeURIComponent(editingClassId)}`, {
        method: isCreating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classItem: values }),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) {
        setMessage([result.message, ...(result.errors ?? [])].filter(Boolean).join("\n") || "교육 정보를 저장하지 못했습니다.");
        setMessageIsError(true);
        return;
      }
      setEditingClassId(null);
      setMessage(isCreating ? "교육 과정을 추가했습니다." : "교육 정보를 수정했습니다.");
      setMessageIsError(false);
      router.refresh();
    } catch {
      setMessage("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.manager}>
      <div className={styles.catalogHeading}>
        <div>
          <p className={styles.sectionEyebrow}>HARU · CLASS CATALOG</p>
          <h2>등록된 교육 과정 <span>{classes.length}</span></h2>
        </div>
        <button className={styles.primaryButton} type="button" onClick={openCreateForm} disabled={saving}>
          과정 추가 <span aria-hidden="true">＋</span>
        </button>
      </div>

      <p className={styles.catalogHelp}>운영 과정을 저장하고 공개 상태를 관리합니다. 초안은 관리자에게만 보이며, 공개 과정은 교육 일정 페이지에 표시됩니다. 신청 접수는 외부 공식 신청 URL로 연결됩니다.</p>
      {message ? <p className={messageIsError ? styles.errorMessage : styles.successMessage} role={messageIsError ? "alert" : "status"}>{message}</p> : null}

      {editingClassId ? (
        <form className={styles.editor} onSubmit={saveClass} aria-labelledby="academy-class-editor-title">
          <div className={styles.editorHeading}>
            <div>
              <p className={styles.sectionEyebrow}>{editingClassId === "new" ? "ADD AN ACADEMY CLASS" : "EDIT AN ACADEMY CLASS"}</p>
              <h3 id="academy-class-editor-title">{editingClassId === "new" ? "교육 과정 추가" : "교육 과정 수정"}</h3>
            </div>
            <p>시간은 한국 시간(Asia/Seoul)으로 저장됩니다.</p>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="academy-title">과정명 <span>필수</span></label>
              <input id="academy-title" value={values.title} onChange={(event) => updateField("title", event.target.value)} maxLength={120} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-category">교육 분야 <span>필수</span></label>
              <select id="academy-category" value={values.category} onChange={(event) => updateField("category", event.target.value as ClassCategory)}>
                {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-publication">공개 상태 <span>필수</span></label>
              <select id="academy-publication" value={values.publicationState} onChange={(event) => updateField("publicationState", event.target.value as PublicationState)}>
                {publicationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-status">모집 상태 <span>필수</span></label>
              <select id="academy-status" value={values.recruitmentStatus} onChange={(event) => updateField("recruitmentStatus", event.target.value as RecruitmentStatus)}>
                {recruitmentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-instructor-names">강사 이름 <span>한 줄에 한 명</span></label>
              <textarea id="academy-instructor-names" rows={2} value={values.instructorNamesText} onChange={(event) => updateField("instructorNamesText", event.target.value)} maxLength={500} />
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-instructor-ids">등록된 강사 ID <span>선택 · 한 줄 또는 쉼표로 구분</span></label>
              <textarea id="academy-instructor-ids" rows={2} value={values.instructorIdsText} onChange={(event) => updateField("instructorIdsText", event.target.value)} maxLength={500} />
            </div>
            <div className={`${styles.field} ${styles.wideField}`}>
              <label htmlFor="academy-introduction">과정 소개 <span>필수</span></label>
              <textarea id="academy-introduction" rows={4} value={values.introduction} onChange={(event) => updateField("introduction", event.target.value)} maxLength={3000} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-audience">교육 대상 <span>항목마다 한 줄</span></label>
              <textarea id="academy-audience" rows={3} value={values.audienceText} onChange={(event) => updateField("audienceText", event.target.value)} maxLength={1000} />
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-curriculum">커리큘럼 <span>항목마다 한 줄</span></label>
              <textarea id="academy-curriculum" rows={3} value={values.curriculumText} onChange={(event) => updateField("curriculumText", event.target.value)} maxLength={3000} />
            </div>
            <div className={`${styles.field} ${styles.wideField}`}>
              <label htmlFor="academy-sessions">회차 일정 <span>필수 · 한 회차마다 한 줄</span></label>
              <textarea id="academy-sessions" rows={4} value={values.sessionsText} onChange={(event) => updateField("sessionsText", event.target.value)} maxLength={6000} placeholder={"2026-11-01T10:00 | 2026-11-01T17:00 | MAY.ONE 교육장"} />
              <small>형식: 시작 일시 | 종료 일시 | 장소. 날짜와 시각은 YYYY-MM-DDTHH:mm 형식으로 입력해 주세요.</small>
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-tuition">교육비 (원) <span>필수</span></label>
              <input id="academy-tuition" type="number" min="0" step="1" inputMode="numeric" value={values.tuitionAmount} onChange={(event) => updateField("tuitionAmount", event.target.value)} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-deadline">신청 마감 일시 <span>선택</span></label>
              <input id="academy-deadline" type="datetime-local" value={values.deadlineAt} onChange={(event) => updateField("deadlineAt", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-includes">교육비 포함 내역 <span>항목마다 한 줄</span></label>
              <textarea id="academy-includes" rows={3} value={values.tuitionIncludesText} onChange={(event) => updateField("tuitionIncludesText", event.target.value)} maxLength={1000} />
            </div>
            <div className={styles.field}>
              <label htmlFor="academy-materials">준비물 <span>항목마다 한 줄</span></label>
              <textarea id="academy-materials" rows={3} value={values.tuitionMaterialsText} onChange={(event) => updateField("tuitionMaterialsText", event.target.value)} maxLength={1000} />
            </div>
            <div className={`${styles.field} ${styles.wideField}`}>
              <label htmlFor="academy-cancellation">취소 안내 <span>필수</span></label>
              <textarea id="academy-cancellation" rows={3} value={values.cancellationPolicy} onChange={(event) => updateField("cancellationPolicy", event.target.value)} maxLength={2000} required />
            </div>
            <div className={`${styles.field} ${styles.wideField}`}>
              <label htmlFor="academy-application-url">공식 신청 URL <span>모집 중 과정은 필수</span></label>
              <input id="academy-application-url" type="url" value={values.applicationUrl} onChange={(event) => updateField("applicationUrl", event.target.value)} maxLength={500} placeholder="https://" />
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryButton} type="submit" disabled={saving}>{saving ? "저장 중…" : "과정 저장"}</button>
            <button className={styles.secondaryButton} type="button" onClick={() => setEditingClassId(null)} disabled={saving}>취소</button>
          </div>
        </form>
      ) : null}

      {classes.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>등록된 운영 과정이 없습니다.</h3>
          <p>과정을 추가하면 초안으로 저장됩니다. 공개 상태로 바꿔야 교육 일정 페이지에 표시됩니다.</p>
        </div>
      ) : (
        <ol className={styles.offerList}>
          {classes.map((item) => {
            const instructors = [...new Set([...(item.instructorNames ?? []), ...item.instructorIds])];
            const sessions = item.sessions.map((session, index) => `${index + 1}회차 · ${dateLabel(session.startsAt)} · ${session.location}`).join(" / ");
            return (
              <li key={item.id}>
                <article className={styles.offerCard}>
                  <header className={styles.offerHeader}>
                    <div>
                      <p className={styles.offerLabel}>{item.publicationState === "published" ? "PUBLIC COURSE" : "DRAFT COURSE"} · {item.id}</p>
                      <h4>{item.title}</h4>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[`status_${item.recruitmentStatus}`]}`}>
                      {item.publicationState === "published" ? "공개" : "초안"} · {statusLabels[item.recruitmentStatus]}
                    </span>
                  </header>
                  <p className={styles.summary}>{item.introduction}</p>
                  <dl className={styles.offerDetails}>
                    <div><dt>분야 · 강사</dt><dd>{categoryLabels[item.category]} · {instructors.length ? instructors.join(", ") : "강사 정보 없음"}</dd></div>
                    <div><dt>일정</dt><dd>{sessions || "일정 정보 없음"}</dd></div>
                    <div><dt>교육 대상</dt><dd>{item.audience.join(" · ") || "미입력"}</dd></div>
                    <div><dt>교육비</dt><dd>{moneyLabel(item.tuition.amount)}</dd></div>
                  </dl>
                  <footer className={styles.offerFooter}>
                    <div className={styles.courseLinks}>
                      {item.publicationState === "published" ? <Link href={`/haru/classes/${encodeURIComponent(item.id)}`}>공개 화면</Link> : <span>초안은 공개되지 않음</span>}
                    </div>
                    <div className={styles.actions}>
                      <button className={styles.secondaryButton} type="button" onClick={() => openEditForm(item)} disabled={saving}>수정</button>
                    </div>
                  </footer>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
