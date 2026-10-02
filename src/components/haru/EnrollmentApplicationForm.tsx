"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MockClassOfferDialog } from "@/components/haru/MockClassOfferDialog";
import type { MockClassOffer } from "@/lib/mock-class-offers";
import { canApplyToMockOffer, getMockOfferDisplayStatus } from "@/lib/mock-class-offers";
import { validateMockEnrollment, type MockEnrollmentErrors, type MockEnrollmentValues } from "@/lib/mock-enrollment-form";
import { brandCopy } from "@/content/brand";
import styles from "./EnrollmentApplicationForm.module.css";

interface EnrollmentApplicationFormProps {
  offers: readonly MockClassOffer[];
  initialClassId?: string;
  requestedClassId?: string;
  queryWasRepeated: boolean;
  csvStorageAvailable: boolean;
}

const categoryLabels: Record<MockClassOffer["category"], string> = {
  CUT: "커트",
  PERM: "펌",
  COLOR: "컬러",
  CONSULTING: "디자인 상담",
  SALON_WORK: "살롱 실무",
};

const statusLabels: Record<MockClassOffer["recruitmentStatus"], string> = {
  upcoming: "모집 예정",
  open: "모집 중",
  closed: "모집 마감",
  completed: "교육 종료",
};

const initialValues: MockEnrollmentValues = { name: "", phone: "", salon: "", experience: "", inquiry: "" };
const successMessage = "테스트 데이터가 로컬 CSV에 저장되었습니다. 실제 수강 신청은 접수되지 않았습니다.";

function monthKey(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit" }).format(date)
    : "unknown";
}

function monthLabel(value: string): string {
  const [year, month] = value.split("-");
  return `${year}년 ${Number(month)}월`;
}

function formatDate(value: string, timeZone = "Asia/Seoul"): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "일정 확인 중";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatTime(value: string, timeZone = "Asia/Seoul"): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("ko-KR", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date)
    : "시간 확인 중";
}

function formatTuition(amount: number): string {
  if (amount === 0) return "무료";
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(amount);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "확인 중";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function defaultMonth(offers: readonly MockClassOffer[], initialClassId?: string): string {
  const selected = offers.find((offer) => offer.id === initialClassId);
  if (selected) return monthKey(selected.startsAt);
  const nextOpen = offers.find((offer) => canApplyToMockOffer(offer));
  return monthKey((nextOpen ?? offers[0])?.startsAt ?? "");
}

export function EnrollmentApplicationForm({ offers, initialClassId, requestedClassId, queryWasRepeated, csvStorageAvailable }: EnrollmentApplicationFormProps) {
  const [selectedClassId, setSelectedClassId] = useState(initialClassId ?? "");
  const [activeMonth, setActiveMonth] = useState(() => defaultMonth(offers, initialClassId));
  const [values, setValues] = useState<MockEnrollmentValues>(initialValues);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<MockEnrollmentErrors>({});
  const [success, setSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [activeOffer, setActiveOffer] = useState<MockClassOffer | null>(null);
  const focusApplicantStepRef = useRef(false);
  const applicantHeadingRef = useRef<HTMLHeadingElement>(null);

  const sortedOffers = useMemo(() => [...offers].sort((left, right) => {
    const statusRank = { open: 0, upcoming: 1, closed: 2, completed: 3 };
    const rankDifference = statusRank[getMockOfferDisplayStatus(left, now)] - statusRank[getMockOfferDisplayStatus(right, now)];
    return rankDifference || Date.parse(left.startsAt) - Date.parse(right.startsAt);
  }), [offers, now]);
  const months = useMemo(() => [...new Set(sortedOffers.map((offer) => monthKey(offer.startsAt)))].sort(), [sortedOffers]);
  const visibleOffers = sortedOffers.filter((offer) => monthKey(offer.startsAt) === activeMonth);
  const selectedOffer = offers.find((offer) => offer.id === selectedClassId && canApplyToMockOffer(offer, now));
  const availableCount = offers.filter((offer) => canApplyToMockOffer(offer, now)).length;
  const invalidQuery = Boolean(requestedClassId && !initialClassId);
  const haru = brandCopy.records[0].home.haru;

  useEffect(() => {
    if (!focusApplicantStepRef.current || !selectedOffer) return;
    const heading = applicantHeadingRef.current;
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    focusApplicantStepRef.current = false;
  }, [selectedOffer]);

  function updateField(field: keyof MockEnrollmentValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccess(false);
    setSubmissionError("");
  }

  function selectMonth(month: string) {
    setActiveMonth(month);
    setErrors((current) => ({ ...current, classId: undefined }));
  }

  function selectOffer(offer: MockClassOffer): boolean {
    const currentTime = new Date();
    setNow(currentTime);
    if (!canApplyToMockOffer(offer, currentTime)) return false;
    setSelectedClassId(offer.id);
    setErrors((current) => ({ ...current, classId: undefined }));
    setSuccess(false);
    setSubmissionError("");
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentTime = new Date();
    setNow(currentTime);
    const currentSelection = offers.find((offer) => offer.id === selectedClassId);
    const nextErrors = validateMockEnrollment(values, currentSelection, agreed, currentTime);
    setErrors(nextErrors);
    setSuccess(false);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmissionError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/mock-enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedClassId, values, agreed }),
      });
      const result: unknown = await response.json().catch(() => null);
      const resultRecord = typeof result === "object" && result !== null ? result as Record<string, unknown> : {};

      if (!response.ok) {
        if (response.status === 422 && typeof resultRecord.errors === "object" && resultRecord.errors !== null) {
          setErrors(resultRecord.errors as MockEnrollmentErrors);
        }
        setSubmissionError(typeof resultRecord.message === "string" ? resultRecord.message : "테스트 데이터를 저장하지 못했습니다. 다시 시도해 주세요.");
        return;
      }

      setValues(initialValues);
      setAgreed(false);
      setErrors({});
      setSubmissionError("");
      setSuccess(true);
    } catch {
      setSubmissionError("서버에 연결할 수 없습니다. 로컬 개발 서버 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const nameErrorId = "applicant-name-error";
  const phoneErrorId = "applicant-phone-error";
  const agreementErrorId = "test-agreement-error";

  return (
    <div className={styles.application}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>{haru.eyebrow}</p>
          <p className={styles.heroKicker}>수강 신청 · COURSE APPLICATION</p>
          <h1 className={styles.heroTitle} id="application-form-title">{haru.title}</h1>
          <p className={styles.heroEnglish}>{haru.englishTitle}</p>
          <p className={styles.heroDescription}>{haru.description}</p>
          <a className={styles.heroAction} href={selectedOffer ? "#application-info" : "#course-offers"}>
            {selectedOffer ? "신청 정보 입력" : "모집 과정 선택"} <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className={styles.heroVisual} aria-label="HARU, Learn. Grow. Lead." role="img">
          <div className={styles.visualTop}><span>H</span><span>HAIR PROFESSIONAL ACADEMY</span></div>
          <div className={styles.visualOrb} aria-hidden="true"><i /><i /><i /></div>
          <p className={styles.visualTitle}>LEARN.<br />GROW.<br /><em>LEAD.</em></p>
          <div className={styles.visualBottom}><span>교육에서 현장으로</span><span>SEOUL · KOREA</span></div>
        </div>
      </header>

      <aside className={styles.testNotice} aria-label="테스트 신청 안내">
        <span className={styles.noticeMark} aria-hidden="true">!</span>
        <div>
          <p className={styles.testLabel}>DEMO APPLICATION · TEST ONLY</p>
          <p>{csvStorageAvailable
            ? "신청 흐름 테스트용 화면입니다. 실제 개인정보가 아닌 임의의 값만 입력해 주세요. 제출한 데이터는 이 로컬 개발 서버의 .local-data/mock-enrollments.csv에 저장되며 외부로 전송되지 않습니다."
            : "신청 흐름 미리보기 화면입니다. 실제 개인정보가 아닌 임의의 값만 입력해 주세요. Preview 서버는 파일 저장을 지원하지 않아 제출은 로컬 개발 서버에서만 가능합니다."}</p>
        </div>
      </aside>

      {queryWasRepeated || invalidQuery ? (
        <div className={styles.queryNotice} role="status">
          {queryWasRepeated ? "과정 주소가 여러 번 전달되어 과정은 자동 선택되지 않았습니다." : "요청한 과정은 신청할 수 없어 자동 선택되지 않았습니다. 아래 모집 상태를 확인해 주세요."}
        </div>
      ) : null}

      <ol className={styles.progressSteps} aria-label="수강 신청 단계">
        <li aria-current={selectedOffer ? undefined : "step"} className={`${styles.progressStep} ${selectedOffer ? styles.progressComplete : styles.progressCurrent}`}>
          <span className={styles.progressNumber}>{selectedOffer ? "✓" : "01"}</span>
          <span className={styles.progressCopy}><small>STEP 01</small><strong>과정 선택</strong></span>
        </li>
        <li aria-current={selectedOffer ? "step" : undefined} className={`${styles.progressStep} ${selectedOffer ? styles.progressCurrent : styles.progressPending}`}>
          <span className={styles.progressNumber}>02</span>
          <span className={styles.progressCopy}><small>STEP 02</small><strong>신청 정보</strong></span>
        </li>
      </ol>

      {!selectedOffer ? (
      <section className={styles.courseSection} id="course-offers" aria-labelledby="course-section-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.step}>01 / CHOOSE A CLASS</p>
            <h2 className={styles.sectionTitle} id="course-section-title">신청할 교육 과정을 선택하세요</h2>
            <p className={styles.sectionDescription}>과정 정보를 살펴보고 신청 가능한 강의를 선택하면 신청 정보 입력 단계로 이어집니다.</p>
          </div>
          <div className={styles.openCount}>
            <span>신청 가능 과정</span>
            <strong>{String(availableCount).padStart(2, "0")}</strong>
          </div>
        </div>
        {errors.classId ? <p className={styles.error} role="alert">{errors.classId}</p> : null}

        {months.length > 0 ? (
          <div className={styles.monthTabs} role="group" aria-label="교육 월 선택">
            {months.map((month) => {
              const count = sortedOffers.filter((offer) => monthKey(offer.startsAt) === month).length;
              return (
                <button
                  aria-pressed={activeMonth === month}
                  className={`${styles.monthTab} ${activeMonth === month ? styles.monthTabActive : ""}`}
                  key={month}
                  onClick={() => selectMonth(month)}
                  type="button"
                >
                  <span>{monthLabel(month)}</span><small>{String(count).padStart(2, "0")}</small>
                </button>
              );
            })}
          </div>
        ) : null}

        {visibleOffers.length === 0 ? (
          <p className={styles.emptyNotice}>확인할 과정이 없습니다. 교육 일정이 확정되면 이곳에 안내하겠습니다.</p>
        ) : (
          <fieldset className={styles.offerList}>
            <legend className="srOnly">{monthLabel(activeMonth)} 교육 과정 선택</legend>
            {visibleOffers.map((offer, index) => {
              const eligible = canApplyToMockOffer(offer, now);
              const status = getMockOfferDisplayStatus(offer, now);
              const selected = offer.id === selectedClassId;
              return (
                <article className={`${styles.offerCard} ${selected ? styles.offerCardSelected : ""} ${!eligible ? styles.offerCardDisabled : ""}`} key={offer.id}>
                  <button
                    aria-expanded={activeOffer?.id === offer.id}
                    aria-haspopup="dialog"
                    aria-label={`${offer.title} 상세 보기 · ${statusLabels[status]}${selected ? " · 선택됨" : ""}`}
                    className={styles.offerCardTrigger}
                    onClick={() => { setNow(new Date()); setActiveOffer(offer); setSuccess(false); }}
                    type="button"
                  >
                    <span className={styles.offerCardBody}>
                      <span className={`${styles.offerArtwork} ${styles[`artwork${offer.category}`]}`} aria-hidden="true">
                        <span className={styles.artworkIndex}>{String(index + 1).padStart(2, "0")}</span>
                        <span className={styles.artworkWord}>{offer.category === "SALON_WORK" ? "SALON" : offer.category}</span>
                        <span className={styles.artworkCaption}>HARU · CLASS FILE</span>
                        <span className={styles.artworkLine} />
                      </span>
                      <span className={styles.offerContent}>
                        <span className={styles.offerTopLine}>
                          <span className={styles.offerCategory}>{categoryLabels[offer.category]}</span>
                          <span className={`${styles.status} ${status === "open" ? styles.statusOpen : ""}`}>{statusLabels[status]}</span>
                        </span>
                        <span className={styles.offerTitle}>{offer.title}</span>
                        <span className={styles.offerSummary}>{offer.summary}</span>
                        <span className={styles.sessionFeature}>
                          <span className={styles.sessionDay}>{formatDate(offer.startsAt, offer.timeZone)}</span>
                          <span>{formatTime(offer.startsAt, offer.timeZone)} — {formatTime(offer.endsAt, offer.timeZone)}</span>
                        </span>
                        <span className={styles.offerMeta}><strong>강사</strong>{offer.instructorLabel}</span>
                        <span className={styles.offerMeta}><strong>대상</strong>{offer.audience}</span>
                        <span className={styles.offerMeta}><strong>장소</strong>{offer.location}</span>
                        <span className={styles.offerFooter}>
                          <span className={styles.tuition}>{formatTuition(offer.tuitionKrw)}</span>
                          <span className={styles.selectPrompt}>{selected ? "선택 완료 ✓" : eligible ? "상세 확인 →" : `${statusLabels[status]} · 정보 확인 →`}</span>
                        </span>
                        <span className={styles.offerDeadline}>신청 마감 {formatDateTime(offer.applicationDeadline)} · 준비물 {offer.materials}</span>
                      </span>
                    </span>
                  </button>
                </article>
              );
            })}
          </fieldset>
        )}
      </section>
      ) : (
        <section className={styles.selectedCourseSection} id="selected-course" aria-labelledby="selected-course-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.step}>01 / COURSE SELECTED</p>
              <h2 className={styles.sectionTitle} id="selected-course-title">이 과정으로 신청합니다</h2>
              <p className={styles.sectionDescription}>일정과 비용을 확인하고 신청 정보를 입력해 주세요.</p>
            </div>
            <ButtonLink href="/haru/classes#mock-classes-title" variant="secondary">다른 과정 찾기</ButtonLink>
          </div>

          <article className={styles.selectedCourseCard}>
            <header className={styles.selectedCourseHeader}>
              <div className={styles.selectedCourseIdentity}>
                <div className={styles.offerTopLine}>
                  <span className={styles.offerCategory}>{categoryLabels[selectedOffer.category]}</span>
                  <span className={`${styles.status} ${styles.statusOpen}`}>모집 중</span>
                </div>
                <h3>{selectedOffer.title}</h3>
                <p>{selectedOffer.summary}</p>
              </div>
              <div className={styles.selectedCourseTuition}>
                <span>교육비</span>
                <strong>{formatTuition(selectedOffer.tuitionKrw)}</strong>
              </div>
            </header>
            <dl className={styles.selectedCourseDetails}>
              <div><dt>일정</dt><dd>{formatDate(selectedOffer.startsAt, selectedOffer.timeZone)} · {formatTime(selectedOffer.startsAt, selectedOffer.timeZone)} — {formatTime(selectedOffer.endsAt, selectedOffer.timeZone)}</dd></div>
              <div><dt>강사</dt><dd>{selectedOffer.instructorLabel}</dd></div>
              <div><dt>대상</dt><dd>{selectedOffer.audience}</dd></div>
              <div><dt>장소</dt><dd>{selectedOffer.location}</dd></div>
              <div><dt>준비물</dt><dd>{selectedOffer.materials || "별도 안내 없음"}</dd></div>
              <div><dt>신청 마감</dt><dd>{formatDateTime(selectedOffer.applicationDeadline)}</dd></div>
            </dl>
          </article>
        </section>
      )}

      {selectedOffer ? (
      <section className={styles.applicationSection} id="application-info" aria-labelledby="applicant-section-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.step}>02 / YOUR INFORMATION</p>
            <h2 className={styles.sectionTitle} id="applicant-section-title" ref={applicantHeadingRef} tabIndex={-1}>신청 정보를 입력하세요</h2>
            <p className={styles.sectionDescription}>시연용 입력 항목이며, 실제 신청이나 상담으로 전달되지 않습니다.</p>
          </div>
        </div>

        <div className={styles.applicationGrid}>
          <form aria-labelledby="applicant-section-title" className={styles.applicantPanel} noValidate onSubmit={handleSubmit}>
            <div className={styles.formIntro}>
              <span className={styles.formStep}>APPLICANT DETAILS</span>
              <span>필수 항목 <b>*</b></span>
            </div>
            {errors.classId ? <p className={styles.error} role="alert">{errors.classId}</p> : null}
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label htmlFor="applicant-name">이름 <span className={styles.required}>필수</span></label>
                <input autoComplete="off" id="applicant-name" maxLength={40} onChange={(event) => updateField("name", event.target.value)} value={values.name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? nameErrorId : undefined} />
                {errors.name ? <p className={styles.error} id={nameErrorId} role="alert">{errors.name}</p> : null}
              </div>
              <div className={styles.field}>
                <label htmlFor="applicant-phone">휴대전화 <span className={styles.required}>필수</span></label>
                <input autoComplete="off" id="applicant-phone" inputMode="tel" maxLength={20} onChange={(event) => updateField("phone", event.target.value)} placeholder="010-0000-0000" type="tel" value={values.phone} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? phoneErrorId : "applicant-phone-hint"} />
                <p className={styles.hint} id="applicant-phone-hint">테스트용 번호를 입력해 주세요.</p>
                {errors.phone ? <p className={styles.error} id={phoneErrorId} role="alert">{errors.phone}</p> : null}
              </div>
              <div className={styles.field}>
                <label htmlFor="applicant-salon">근무 매장 <span className={styles.optional}>선택</span></label>
                <input autoComplete="off" id="applicant-salon" maxLength={80} onChange={(event) => updateField("salon", event.target.value)} value={values.salon} />
              </div>
              <div className={styles.field}>
                <label htmlFor="applicant-experience">경력 <span className={styles.optional}>선택</span></label>
                <input autoComplete="off" id="applicant-experience" maxLength={60} onChange={(event) => updateField("experience", event.target.value)} placeholder="예: 미용 전공 1년" value={values.experience} />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label htmlFor="applicant-inquiry">문의사항 <span className={styles.optional}>선택</span></label>
                <textarea id="applicant-inquiry" maxLength={500} onChange={(event) => updateField("inquiry", event.target.value)} rows={4} value={values.inquiry} />
              </div>
            </div>

            <div className={styles.agreement}>
              <label htmlFor="test-agreement">
                <input checked={agreed} id="test-agreement" onChange={(event) => { setAgreed(event.target.checked); setErrors((current) => ({ ...current, agreement: undefined })); setSubmissionError(""); }} type="checkbox" aria-invalid={Boolean(errors.agreement)} aria-describedby={errors.agreement ? agreementErrorId : undefined} />
                <span>실제 개인정보가 아닌 테스트용 임의 값만 입력했습니다.</span>
              </label>
              {errors.agreement ? <p className={styles.error} id={agreementErrorId} role="alert">{errors.agreement}</p> : null}
            </div>

            <div className={styles.submitArea}>
              <Button type="submit" disabled={!selectedOffer || submitting || !csvStorageAvailable}>
                {submitting ? "저장 중…" : "테스트 데이터 저장"} <span aria-hidden="true">{submitting ? "…" : "→"}</span>
              </Button>
              <p className={styles.submitNote}>
                {csvStorageAvailable ? <><code>.local-data/mock-enrollments.csv</code>에 저장됩니다. 실제 수강 신청은 접수되지 않습니다.</> : "CSV 저장은 로컬 개발 서버에서만 가능합니다."}
              </p>
            </div>
            {submissionError ? <p className={styles.error} role="alert">{submissionError}</p> : null}
            {success ? <p className={styles.success} role="status">{successMessage}</p> : null}
          </form>
        </div>
      </section>
      ) : null}

      {activeOffer ? (
        <MockClassOfferDialog
          detailHref={`/haru/classes/${encodeURIComponent(activeOffer.id)}`}
          key={activeOffer.id}
          offer={activeOffer}
          onClose={() => setActiveOffer(null)}
          onSelect={() => {
            if (selectOffer(activeOffer)) {
              focusApplicantStepRef.current = true;
              setActiveOffer(null);
            }
          }}
          selected={selectedClassId === activeOffer.id}
        />
      ) : null}
    </div>
  );
}
