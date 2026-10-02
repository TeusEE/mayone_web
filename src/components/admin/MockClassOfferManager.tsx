"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { canApplyToMockOffer, getMockOfferDisplayStatus, groupMockClassOffersByCategoryAndStartDate, type MockClassOffer } from "@/lib/mock-class-offers";
import type { ClassCategory, RecruitmentStatus } from "@/types/content";
import styles from "./MockClassOfferManager.module.css";

interface OfferFormValues {
  title: string;
  category: ClassCategory;
  instructorLabel: string;
  summary: string;
  audience: string;
  startsAt: string;
  endsAt: string;
  location: string;
  tuitionKrw: string;
  materials: string;
  recruitmentStatus: RecruitmentStatus;
  applicationDeadline: string;
}

interface ApiResult {
  message?: string;
  errors?: string[];
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

const categoryOptions = Object.entries(categoryLabels) as [ClassCategory, string][];
const statusOptions = Object.entries(statusLabels) as [RecruitmentStatus, string][];

function emptyForm(): OfferFormValues {
  return {
    title: "",
    category: "CUT",
    instructorLabel: "가상 강사 (테스트)",
    summary: "",
    audience: "테스트용 대상자",
    startsAt: "",
    endsAt: "",
    location: "테스트 교육장 (가상)",
    tuitionKrw: "0",
    materials: "준비물 없음",
    recruitmentStatus: "upcoming",
    applicationDeadline: "",
  };
}

function seoulDateTimeInput(value: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function formFromOffer(offer: MockClassOffer): OfferFormValues {
  return {
    title: offer.title,
    category: offer.category,
    instructorLabel: offer.instructorLabel,
    summary: offer.summary,
    audience: offer.audience,
    startsAt: seoulDateTimeInput(offer.startsAt),
    endsAt: seoulDateTimeInput(offer.endsAt),
    location: offer.location,
    tuitionKrw: String(offer.tuitionKrw),
    materials: offer.materials,
    recruitmentStatus: offer.recruitmentStatus,
    applicationDeadline: seoulDateTimeInput(offer.applicationDeadline),
  };
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function tuitionLabel(value: number): string {
  return value === 0
    ? "무료"
    : new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);
}

export function MockClassOfferManager({ offers }: { offers: readonly MockClassOffer[] }) {
  const router = useRouter();
  const offerGroups = groupMockClassOffersByCategoryAndStartDate(offers);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [values, setValues] = useState<OfferFormValues>(emptyForm);
  const [confirmingClassId, setConfirmingClassId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  function openCreateForm() {
    setValues(emptyForm());
    setEditingClassId("new");
    setConfirmingClassId(null);
    setMessage("");
  }

  function openEditForm(offer: MockClassOffer) {
    setValues(formFromOffer(offer));
    setEditingClassId(offer.id);
    setConfirmingClassId(null);
    setMessage("");
  }

  function closeForm() {
    setEditingClassId(null);
    setMessage("");
  }

  function updateField<K extends keyof OfferFormValues>(field: K, value: OfferFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingClassId) return;
    setSaving(true);
    setMessage("");

    const isCreating = editingClassId === "new";
    const url = isCreating ? "/api/mock-class-offers" : `/api/mock-class-offers/${encodeURIComponent(editingClassId)}`;
    try {
      const response = await fetch(url, {
        method: isCreating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer: values }),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) {
        setMessage([result.message, ...(result.errors ?? [])].filter(Boolean).join("\n") || "수강 과목을 저장하지 못했습니다.");
        setMessageIsError(true);
        return;
      }

      setEditingClassId(null);
      setMessage(isCreating ? "수강 과목을 추가했습니다." : "수강 과목을 수정했습니다.");
      setMessageIsError(false);
      router.refresh();
    } catch {
      setMessage("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteOffer(classId: string) {
    setDeletingClassId(classId);
    setMessage("");
    try {
      const response = await fetch(`/api/mock-class-offers/${encodeURIComponent(classId)}`, { method: "DELETE" });
      const result = await response.json() as ApiResult;
      if (!response.ok) {
        setMessage(result.message ?? "수강 과목을 삭제하지 못했습니다.");
        setMessageIsError(true);
        return;
      }

      setConfirmingClassId(null);
      setMessage("수강 과목을 삭제했습니다.");
      setMessageIsError(false);
      router.refresh();
    } catch {
      setMessage("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setMessageIsError(true);
    } finally {
      setDeletingClassId(null);
    }
  }

  return (
    <div className={styles.manager}>
      <div className={styles.catalogHeading}>
        <div>
          <p className={styles.sectionEyebrow}>MOCK CLASS CATALOG</p>
          <h2>등록된 수강 과목 <span>{offers.length}</span></h2>
        </div>
        <button className={styles.primaryButton} type="button" onClick={openCreateForm} disabled={saving || deletingClassId !== null}>
          과목 추가 <span aria-hidden="true">＋</span>
        </button>
      </div>

      <p className={styles.catalogHelp}>
        일정·모집 상태는 교육 목록과 신청 화면에 적용됩니다. 변경·삭제해도 기존 신청 기록의 과정 정보는 신청 당시 내용으로 남습니다.
      </p>

      {message && (
        <p className={messageIsError ? styles.errorMessage : styles.successMessage} role={messageIsError ? "alert" : "status"}>
          {message}
        </p>
      )}

      {editingClassId && (
        <form className={styles.editor} onSubmit={saveOffer} aria-labelledby="course-editor-title">
          <div className={styles.editorHeading}>
            <div>
              <p className={styles.sectionEyebrow}>{editingClassId === "new" ? "ADD A MOCK COURSE" : "EDIT A MOCK COURSE"}</p>
              <h3 id="course-editor-title">{editingClassId === "new" ? "수강 과목 추가" : "수강 과목 수정"}</h3>
            </div>
            <p>모든 시간은 한국 시간(Asia/Seoul)으로 저장됩니다.</p>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="course-title">과목명 <span>필수</span></label>
              <input id="course-title" name="title" value={values.title} onChange={(event) => updateField("title", event.target.value)} maxLength={120} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="course-category">분야 <span>필수</span></label>
              <select id="course-category" name="category" value={values.category} onChange={(event) => updateField("category", event.target.value as ClassCategory)}>
                {categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="course-instructor">강사 표기 <span>필수</span></label>
              <input id="course-instructor" name="instructorLabel" value={values.instructorLabel} onChange={(event) => updateField("instructorLabel", event.target.value)} maxLength={80} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="course-audience">교육 대상 <span>필수</span></label>
              <input id="course-audience" name="audience" value={values.audience} onChange={(event) => updateField("audience", event.target.value)} maxLength={300} required />
            </div>
            <div className={`${styles.field} ${styles.wideField}`}>
              <label htmlFor="course-summary">과목 소개 <span>필수</span></label>
              <textarea id="course-summary" name="summary" rows={3} value={values.summary} onChange={(event) => updateField("summary", event.target.value)} maxLength={1000} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="course-start">시작 일시 <span>필수</span></label>
              <input id="course-start" name="startsAt" type="datetime-local" value={values.startsAt} onChange={(event) => updateField("startsAt", event.target.value)} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="course-end">종료 일시 <span>필수</span></label>
              <input id="course-end" name="endsAt" type="datetime-local" value={values.endsAt} onChange={(event) => updateField("endsAt", event.target.value)} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="course-deadline">신청 마감 일시 <span>필수</span></label>
              <input id="course-deadline" name="applicationDeadline" type="datetime-local" value={values.applicationDeadline} onChange={(event) => updateField("applicationDeadline", event.target.value)} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="course-status">모집 상태 <span>필수</span></label>
              <select id="course-status" name="recruitmentStatus" value={values.recruitmentStatus} onChange={(event) => updateField("recruitmentStatus", event.target.value as RecruitmentStatus)}>
                {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="course-location">교육 장소 <span>필수</span></label>
              <input id="course-location" name="location" value={values.location} onChange={(event) => updateField("location", event.target.value)} maxLength={200} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="course-tuition">교육비 (원) <span>필수</span></label>
              <input id="course-tuition" name="tuitionKrw" type="number" min="0" step="1" inputMode="numeric" value={values.tuitionKrw} onChange={(event) => updateField("tuitionKrw", event.target.value)} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="course-materials">준비물</label>
              <input id="course-materials" name="materials" value={values.materials} onChange={(event) => updateField("materials", event.target.value)} maxLength={500} />
            </div>
          </div>

          <p className={styles.testOnlyNote}>등록한 과목은 실제 교육이 아닌 테스트용 과정으로 표시됩니다.</p>
          <div className={styles.actions}>
            <button className={styles.primaryButton} type="submit" disabled={saving || deletingClassId !== null}>{saving ? "저장 중…" : "과목 저장"}</button>
            <button className={styles.secondaryButton} type="button" onClick={closeForm} disabled={saving}>취소</button>
          </div>
        </form>
      )}

      {offers.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>등록된 테스트 과목이 없습니다.</h3>
          <p>과목을 추가하면 교육 일정과 수강 신청 시연에 표시됩니다.</p>
        </div>
      ) : (
        <div className={styles.offerGroups}>
          {offerGroups.map((group) => {
            const headingId = `admin-class-category-${group.category.toLowerCase()}`;

            return (
              <section className={styles.offerGroup} key={group.category} aria-labelledby={headingId}>
                <header className={styles.categoryHeading}>
                  <div>
                    <p className={styles.sectionEyebrow}>교육 분야</p>
                    <h3 id={headingId}>{categoryLabels[group.category]}</h3>
                  </div>
                  <span className={styles.categoryCount}>{group.offers.length}개 과정</span>
                </header>
                <ol className={styles.offerList}>
                  {group.offers.map((offer) => {
                    const displayedStatus = getMockOfferDisplayStatus(offer);
                    const statusClass = styles[`status_${displayedStatus}`];
                    const isDeleting = deletingClassId === offer.id;
                    return (
                      <li key={offer.id}>
                        <article className={styles.offerCard}>
                          <header className={styles.offerHeader}>
                            <div>
                              <p className={styles.offerLabel}>TEST COURSE · {offer.id}</p>
                              <h4>{offer.title}</h4>
                            </div>
                            <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabels[displayedStatus]}</span>
                          </header>
                          <p className={styles.summary}>{offer.summary}</p>
                          <dl className={styles.offerDetails}>
                            <div><dt>일정</dt><dd>{displayDate(offer.startsAt)} – {displayDate(offer.endsAt)}</dd></div>
                            <div><dt>신청 마감</dt><dd>{displayDate(offer.applicationDeadline)}</dd></div>
                            <div><dt>강사</dt><dd>{offer.instructorLabel}</dd></div>
                            <div><dt>장소 · 교육비</dt><dd>{offer.location} · {tuitionLabel(offer.tuitionKrw)}</dd></div>
                          </dl>
                          <div className={styles.offerFooter}>
                            <div className={styles.courseLinks}>
                              <Link href={`/haru/classes/${encodeURIComponent(offer.id)}`}>과정 화면</Link>
                              {canApplyToMockOffer(offer) && <Link href={`/haru/apply?classId=${encodeURIComponent(offer.id)}`}>신청 화면</Link>}
                            </div>
                            <div className={styles.actions}>
                              <button className={styles.secondaryButton} type="button" onClick={() => openEditForm(offer)} disabled={saving || deletingClassId !== null}>수정</button>
                              <button className={styles.dangerButton} type="button" onClick={() => { setConfirmingClassId(offer.id); setMessage(""); }} disabled={saving || deletingClassId !== null}>삭제</button>
                            </div>
                          </div>
                          {confirmingClassId === offer.id && (
                            <div className={styles.deleteConfirmation} role="group" aria-label={`${offer.title} 과목 삭제 확인`}>
                              <p>이 과목을 삭제할까요? 기존 신청 기록은 유지되며, 이후 새 신청을 받을 수 없게 됩니다.</p>
                              <div className={styles.actions}>
                                <button className={styles.dangerButton} type="button" onClick={() => deleteOffer(offer.id)} disabled={isDeleting}>
                                  {isDeleting ? "삭제 중…" : "삭제 확정"}
                                </button>
                                <button className={styles.secondaryButton} type="button" onClick={() => setConfirmingClassId(null)} disabled={isDeleting}>취소</button>
                              </div>
                            </div>
                          )}
                        </article>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
