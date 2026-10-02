"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { MockEnrollmentEditableValues, MockEnrollmentCsvRecord } from "@/lib/mock-enrollment-csv";
import styles from "./EnrollmentRecordCard.module.css";

type EditableField = keyof MockEnrollmentEditableValues;
type FieldErrors = Partial<Record<EditableField, string>>;

function formatSubmittedAt(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function formatPhone(value: string): string {
  return /^(\d{3})(\d{3,4})(\d{4})$/.test(value)
    ? value.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3")
    : value;
}

function fieldId(submissionId: string, field: EditableField): string {
  return `edit-${submissionId}-${field}`;
}

export default function EnrollmentRecordCard({
  record,
  groupedCourseTitle,
}: {
  record: MockEnrollmentCsvRecord;
  groupedCourseTitle: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [values, setValues] = useState<MockEnrollmentEditableValues>({
    name: record.name,
    phone: formatPhone(record.phone),
    salon: record.salon,
    experience: record.experience,
    inquiry: record.inquiry,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  function startEditing() {
    setValues({
      name: record.name,
      phone: formatPhone(record.phone),
      salon: record.salon,
      experience: record.experience,
      inquiry: record.inquiry,
    });
    setFieldErrors({});
    setMessage("");
    setConfirmingDelete(false);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setFieldErrors({});
    setMessage("");
  }

  function updateField(field: EditableField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setMessage("");

    try {
      const response = await fetch(`/api/mock-enrollments/${encodeURIComponent(record.submissionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const result = await response.json() as { message?: string; errors?: FieldErrors };

      if (!response.ok) {
        setFieldErrors(result.errors ?? {});
        setMessage(result.message ?? "신청 정보를 수정하지 못했습니다.");
        setMessageIsError(true);
        return;
      }

      setEditing(false);
      setMessage("신청 정보를 수정했습니다.");
      setMessageIsError(false);
      router.refresh();
    } catch {
      setMessage("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord() {
    setDeleting(true);
    setMessage("");

    try {
      const response = await fetch(`/api/mock-enrollments/${encodeURIComponent(record.submissionId)}`, {
        method: "DELETE",
      });
      const result = await response.json() as { message?: string };

      if (!response.ok) {
        setMessage(result.message ?? "신청 정보를 삭제하지 못했습니다.");
        setMessageIsError(true);
        return;
      }

      setConfirmingDelete(false);
      setMessage("신청 기록을 삭제했습니다.");
      setMessageIsError(false);
      router.refresh();
    } catch {
      setMessage("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setMessageIsError(true);
    } finally {
      setDeleting(false);
    }
  }

  const labelFor: Record<EditableField, string> = {
    name: "이름",
    phone: "휴대전화",
    salon: "근무 매장",
    experience: "경력",
    inquiry: "문의사항",
  };

  return (
    <article className={styles.card} aria-labelledby={`applicant-${record.submissionId}`}>
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.cardLabel}>APPLICANT</p>
          <h3 id={`applicant-${record.submissionId}`}>{record.name}</h3>
          {record.classTitle !== groupedCourseTitle && (
            <p className={styles.snapshotCourse}>신청 당시 과정명 · {record.classTitle}</p>
          )}
        </div>
        <time dateTime={record.submittedAt}>{formatSubmittedAt(record.submittedAt)}</time>
      </header>

      {editing ? (
        <form className={styles.editForm} onSubmit={saveChanges} aria-label={`${record.name} 신청 정보 수정`}>
          <p className={styles.formNote}>신청자 입력 정보만 수정할 수 있습니다. 과정과 제출 시각은 유지됩니다.</p>
          <div className={styles.fields}>
            {(["name", "phone", "salon", "experience"] as const).map((field) => {
              const id = fieldId(record.submissionId, field);
              const errorId = `${id}-error`;
              return (
                <div className={styles.field} key={field}>
                  <label htmlFor={id}>{labelFor[field]}{(field === "name" || field === "phone") && <span> 필수</span>}</label>
                  <input
                    id={id}
                    name={field}
                    type={field === "phone" ? "tel" : "text"}
                    autoComplete={field === "name" ? "name" : field === "phone" ? "tel" : "off"}
                    value={values[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    maxLength={field === "name" ? 40 : field === "phone" ? 20 : field === "salon" ? 80 : 60}
                    required={field === "name" || field === "phone"}
                    aria-invalid={Boolean(fieldErrors[field])}
                    aria-describedby={fieldErrors[field] ? errorId : undefined}
                    disabled={saving || deleting}
                  />
                  {fieldErrors[field] && <span className={styles.fieldError} id={errorId}>{fieldErrors[field]}</span>}
                </div>
              );
            })}
            <div className={`${styles.field} ${styles.inquiryField}`}>
              <label htmlFor={fieldId(record.submissionId, "inquiry")}>{labelFor.inquiry}</label>
              <textarea
                id={fieldId(record.submissionId, "inquiry")}
                name="inquiry"
                value={values.inquiry}
                onChange={(event) => updateField("inquiry", event.target.value)}
                maxLength={500}
                rows={4}
                aria-invalid={Boolean(fieldErrors.inquiry)}
                aria-describedby={fieldErrors.inquiry ? `${fieldId(record.submissionId, "inquiry")}-error` : undefined}
                disabled={saving || deleting}
              />
              {fieldErrors.inquiry && <span className={styles.fieldError} id={`${fieldId(record.submissionId, "inquiry")}-error`}>{fieldErrors.inquiry}</span>}
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.primaryButton} type="submit" disabled={saving || deleting}>
              {saving ? "저장 중…" : "변경사항 저장"}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={cancelEditing} disabled={saving || deleting}>취소</button>
          </div>
        </form>
      ) : (
        <dl className={styles.details}>
          <div><dt>이름</dt><dd>{record.name}</dd></div>
          <div><dt>휴대전화</dt><dd>{/^\d{10,11}$/.test(record.phone)
            ? <a href={`tel:${record.phone}`}>{formatPhone(record.phone)}</a>
            : formatPhone(record.phone)}</dd></div>
          <div><dt>근무 매장</dt><dd>{record.salon || "입력 없음"}</dd></div>
          <div><dt>경력</dt><dd>{record.experience || "입력 없음"}</dd></div>
          <div className={styles.inquiryField}><dt>문의사항</dt><dd>{record.inquiry || "입력 없음"}</dd></div>
        </dl>
      )}

      <footer className={styles.cardFooter}>
        <span className={record.testDataAcknowledged ? styles.acknowledged : styles.notAcknowledged}>
          {record.testDataAcknowledged ? "테스트 값 확인" : "테스트 값 확인 안 됨"}
        </span>
        <span>테스트 ID · {record.submissionId}</span>
      </footer>

      {!editing && (
        <div className={styles.actions}>
          <button className={styles.secondaryButton} type="button" onClick={startEditing} disabled={deleting}>수정</button>
          <button
            className={styles.dangerButton}
            type="button"
            onClick={() => { setMessage(""); setConfirmingDelete(true); }}
            disabled={deleting}
          >삭제</button>
        </div>
      )}

      {confirmingDelete && (
        <div className={styles.deleteConfirmation} role="group" aria-label="신청 기록 삭제 확인">
          <p>이 테스트 신청 기록을 삭제할까요? 삭제 후 복구할 수 없습니다.</p>
          <div className={styles.actions}>
            <button className={styles.dangerButton} type="button" onClick={deleteRecord} disabled={deleting}>
              {deleting ? "삭제 중…" : "삭제 확정"}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={() => setConfirmingDelete(false)} disabled={deleting}>취소</button>
          </div>
        </div>
      )}

      {message && (
        <p className={messageIsError ? styles.errorMessage : styles.successMessage} role={messageIsError ? "alert" : "status"}>
          {message}
        </p>
      )}
    </article>
  );
}
