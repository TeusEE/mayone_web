"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Branch, OperationState, PublicationState } from "@/types/content";
import { branchToAdminInput, type AdminBranchInput } from "@/lib/admin-branch-input";
import styles from "./BranchManager.module.css";

interface ApiResult {
  message?: string;
  errors?: string[];
}

const publicationOptions: [PublicationState, string][] = [
  ["draft", "초안 · 공개하지 않음"],
  ["published", "공개 · 검토 완료"],
];

const operationOptions: [OperationState, string][] = [
  ["active", "운영 중"],
  ["inactive", "운영 종료"],
  ["unknown", "운영 여부 확인 중"],
];

function emptyForm(): AdminBranchInput {
  return {
    officialName: "",
    publicationState: "draft",
    operationState: "unknown",
    region: "",
    address: "",
    introduction: "",
    hours: "",
    closedDays: "",
    phone: "",
    bookingUrl: "",
    placeUrl: "",
    directions: "",
    parking: "",
    amenitiesText: "",
  };
}

function branchStatusLabel(branch: Branch): string {
  const publicationLabel = branch.publicationState === "published" ? "공개" : "초안";
  const operationLabel = branch.operationState === "active"
    ? "운영 중"
    : branch.operationState === "inactive"
      ? "운영 종료"
      : "운영 확인 중";
  return `${publicationLabel} · ${operationLabel}`;
}

export function BranchManager({ branches, readOnly = false, allowDelete = true }: { branches: readonly Branch[]; readOnly?: boolean; allowDelete?: boolean }) {
  const router = useRouter();
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [values, setValues] = useState<AdminBranchInput>(emptyForm);
  const [confirmingBranchId, setConfirmingBranchId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  function openCreateForm() {
    setValues(emptyForm());
    setEditingBranchId("new");
    setConfirmingBranchId(null);
    setMessage("");
  }

  function openEditForm(branch: Branch) {
    setValues(branchToAdminInput(branch));
    setEditingBranchId(branch.id);
    setConfirmingBranchId(null);
    setMessage("");
  }

  function closeForm() {
    setEditingBranchId(null);
    setMessage("");
  }

  function updateField<K extends keyof AdminBranchInput>(field: K, value: AdminBranchInput[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function saveBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBranchId) return;

    setSaving(true);
    setMessage("");
    const isCreating = editingBranchId === "new";
    const url = isCreating ? "/api/branches" : `/api/branches/${encodeURIComponent(editingBranchId)}`;

    try {
      const response = await fetch(url, {
        method: isCreating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: values }),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) {
        setMessage([result.message, ...(result.errors ?? [])].filter(Boolean).join("\n") || "지점 정보를 저장하지 못했습니다.");
        setMessageIsError(true);
        return;
      }

      setEditingBranchId(null);
      setMessage(isCreating ? "지점을 추가했습니다." : "지점 정보를 수정했습니다.");
      setMessageIsError(false);
      router.refresh();
    } catch {
      setMessage("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteBranch(branchId: string) {
    setDeletingBranchId(branchId);
    setMessage("");
    try {
      const response = await fetch(`/api/branches/${encodeURIComponent(branchId)}`, { method: "DELETE" });
      const result = await response.json() as ApiResult;
      if (!response.ok) {
        setMessage(result.message ?? "지점을 삭제하지 못했습니다.");
        setMessageIsError(true);
        return;
      }

      setConfirmingBranchId(null);
      setMessage("지점을 삭제했습니다.");
      setMessageIsError(false);
      router.refresh();
    } catch {
      setMessage("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setMessageIsError(true);
    } finally {
      setDeletingBranchId(null);
    }
  }

  return (
    <div className={styles.manager}>
      <div className={styles.catalogHeading}>
        <div>
          <p className={styles.eyebrow}>BRANCH DIRECTORY</p>
          <h2>등록된 지점 <span>{branches.length}</span></h2>
        </div>
        <button className={styles.primaryButton} type="button" onClick={openCreateForm} disabled={readOnly || saving || deletingBranchId !== null}>
          지점 추가 <span aria-hidden="true">＋</span>
        </button>
      </div>

      <p className={styles.helpText}>{readOnly ? "현재 운영 지점 자료는 조회만 가능합니다." : <>공개 및 검토 완료된 지점은 <Link href="/salon">지점 페이지</Link>에 반영됩니다. 확인된 운영 정보만 입력해 주세요.</>}</p>

      {message ? <p className={messageIsError ? styles.errorMessage : styles.successMessage} role={messageIsError ? "alert" : "status"}>{message}</p> : null}

      {editingBranchId ? (
        <form className={styles.editor} onSubmit={saveBranch} aria-labelledby="branch-editor-title">
          <div className={styles.editorHeading}>
            <div>
              <p className={styles.eyebrow}>{editingBranchId === "new" ? "ADD A BRANCH" : "EDIT A BRANCH"}</p>
              <h3 id="branch-editor-title">{editingBranchId === "new" ? "지점 추가" : "지점 정보 수정"}</h3>
            </div>
            <p>공개 지점에는 지역·주소·확인된 운영 상태가 필요합니다.</p>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="branch-name">공식 지점명 <span>필수</span></label>
              <input id="branch-name" name="officialName" value={values.officialName} onChange={(event) => updateField("officialName", event.target.value)} maxLength={120} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="branch-region">지역</label>
              <input id="branch-region" name="region" value={values.region} onChange={(event) => updateField("region", event.target.value)} maxLength={80} placeholder="예: 파주시" />
            </div>
            <div className={`${styles.field} ${styles.wideField}`}>
              <label htmlFor="branch-address">주소</label>
              <input id="branch-address" name="address" value={values.address} onChange={(event) => updateField("address", event.target.value)} maxLength={240} />
            </div>
            <div className={styles.field}>
              <label htmlFor="branch-operation">운영 상태 <span>필수</span></label>
              <select id="branch-operation" name="operationState" value={values.operationState} onChange={(event) => updateField("operationState", event.target.value as OperationState)}>
                {operationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="branch-publication">공개 상태 <span>필수</span></label>
              <select id="branch-publication" name="publicationState" value={values.publicationState} onChange={(event) => updateField("publicationState", event.target.value as PublicationState)}>
                {publicationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="branch-phone">매장 전화번호</label>
              <input id="branch-phone" name="phone" type="tel" value={values.phone} onChange={(event) => updateField("phone", event.target.value)} maxLength={40} />
            </div>
            <div className={styles.field}>
              <label htmlFor="branch-hours">운영 시간</label>
              <input id="branch-hours" name="hours" value={values.hours} onChange={(event) => updateField("hours", event.target.value)} maxLength={240} />
            </div>
            <div className={styles.field}>
              <label htmlFor="branch-closed-days">휴무일</label>
              <input id="branch-closed-days" name="closedDays" value={values.closedDays} onChange={(event) => updateField("closedDays", event.target.value)} maxLength={120} />
            </div>
            <div className={styles.field}>
              <label htmlFor="branch-parking">주차 안내</label>
              <input id="branch-parking" name="parking" value={values.parking} onChange={(event) => updateField("parking", event.target.value)} maxLength={300} />
            </div>
            <div className={`${styles.field} ${styles.wideField}`}>
              <label htmlFor="branch-directions">찾아오는 길</label>
              <textarea id="branch-directions" name="directions" rows={3} value={values.directions} onChange={(event) => updateField("directions", event.target.value)} maxLength={1000} />
            </div>
            <div className={`${styles.field} ${styles.wideField}`}>
              <label htmlFor="branch-introduction">지점 소개</label>
              <textarea id="branch-introduction" name="introduction" rows={3} value={values.introduction} onChange={(event) => updateField("introduction", event.target.value)} maxLength={1000} />
            </div>
            <div className={styles.field}>
              <label htmlFor="branch-booking-url">네이버 예약 URL</label>
              <input id="branch-booking-url" name="bookingUrl" type="url" value={values.bookingUrl} onChange={(event) => updateField("bookingUrl", event.target.value)} maxLength={500} placeholder="https://" />
            </div>
            <div className={styles.field}>
              <label htmlFor="branch-place-url">네이버 플레이스 URL <span>내부 참고</span></label>
              <input id="branch-place-url" name="placeUrl" type="url" value={values.placeUrl} onChange={(event) => updateField("placeUrl", event.target.value)} maxLength={500} placeholder="https://" />
            </div>
            <div className={`${styles.field} ${styles.wideField}`}>
              <label htmlFor="branch-amenities">매장 정보 <span>항목마다 한 줄</span></label>
              <textarea id="branch-amenities" name="amenitiesText" rows={4} value={values.amenitiesText} onChange={(event) => updateField("amenitiesText", event.target.value)} maxLength={1200} placeholder={"헤어스파\n두피클리닉\n유아의자"} />
            </div>
          </div>

          <p className={styles.localNote}>저장 내용은 현재 환경의 지점 목록에 반영됩니다. 실제 지점 운영 정보로 사용하려면 확인 후 공개 상태로 바꾸세요.</p>
          <div className={styles.actions}>
            <button className={styles.primaryButton} type="submit" disabled={saving || deletingBranchId !== null}>{saving ? "저장 중…" : "지점 저장"}</button>
            <button className={styles.secondaryButton} type="button" onClick={closeForm} disabled={saving}>취소</button>
          </div>
        </form>
      ) : null}

      {branches.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>등록된 지점이 없습니다.</h3>
          <p>현재 환경에 등록된 지점 정보가 없습니다.</p>
        </div>
      ) : (
        <ol className={styles.branchList}>
          {branches.map((branch) => (
            <li key={branch.id}>
              <article className={styles.branchCard}>
                <header className={styles.branchHeader}>
                  <div>
                    <p className={styles.branchId}>{branch.id}</p>
                    <h3>{branch.officialName}</h3>
                    <p className={branch.publicationState === "published" ? styles.publishedStatus : styles.draftStatus}>{branchStatusLabel(branch)}</p>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => openEditForm(branch)} disabled={readOnly || saving || deletingBranchId !== null}>수정</button>
                    {allowDelete ? <button className={styles.dangerButton} type="button" onClick={() => { setConfirmingBranchId(branch.id); setMessage(""); }} disabled={readOnly || saving || deletingBranchId !== null}>삭제</button> : null}
                  </div>
                </header>
                <dl className={styles.branchDetails}>
                  {branch.region ? <div><dt>지역</dt><dd>{branch.region}</dd></div> : null}
                  {branch.address ? <div><dt>주소</dt><dd>{branch.address}</dd></div> : null}
                  {branch.hours ? <div><dt>운영 시간</dt><dd>{branch.hours}</dd></div> : null}
                  {branch.phone ? <div><dt>전화</dt><dd>{branch.phone}</dd></div> : null}
                  {branch.bookingUrl ? <div><dt>예약 URL</dt><dd>{branch.bookingUrl}</dd></div> : null}
                </dl>
                {allowDelete && confirmingBranchId === branch.id ? (
                  <div className={styles.deleteConfirmation} role="group" aria-label={`${branch.officialName} 삭제 확인`}>
                    <p>이 지점을 삭제할까요? 공개 상태인 경우 현재 환경의 지점 페이지에서도 사라집니다.</p>
                    <div className={styles.actions}>
                      <button className={styles.dangerButton} type="button" onClick={() => deleteBranch(branch.id)} disabled={deletingBranchId === branch.id}>
                        {deletingBranchId === branch.id ? "삭제 중…" : "삭제 확정"}
                      </button>
                      <button className={styles.secondaryButton} type="button" onClick={() => setConfirmingBranchId(null)} disabled={deletingBranchId === branch.id}>취소</button>
                    </div>
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
