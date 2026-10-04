"use client";

import { useState, type FormEvent } from "react";
import { validateAdminPassword } from "@/lib/admin-access";
import { getAdminAuthError, submitAdminAuth } from "@/lib/admin-auth-client";
import styles from "@/app/admin/auth.module.css";

export function AdminCompleteInviteForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const validationError = validateAdminPassword(password, confirmation);
    setError(validationError);
    if (validationError) return;
    setBusy(true);
    try {
      const result = await submitAdminAuth("password", { password, confirmation });
      window.location.replace(result.redirectTo);
    } catch (cause) {
      setError(getAdminAuthError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-busy={busy}>
      <p id="admin-password-help" className={styles.help}>12~128자의 비밀번호를 입력해 주세요.</p>
      <div className={styles.field}>
        <label htmlFor="admin-new-password">새 비밀번호</label>
        <div className={styles.passwordInput}>
          <input id="admin-new-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" aria-describedby="admin-password-help" minLength={12} maxLength={128} required disabled={busy} value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className={styles.passwordToggle} type="button" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "숨기기" : "표시"}</button>
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="admin-confirm-password">새 비밀번호 확인</label>
        <input id="admin-confirm-password" name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
      </div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "저장 중…" : "비밀번호 저장"}</button>
    </form>
  );
}
