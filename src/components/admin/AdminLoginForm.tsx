"use client";

import { useRef, useState, type FormEvent } from "react";
import { getAdminAuthError, submitAdminAuth } from "@/lib/admin-auth-client";
import styles from "@/app/admin/auth.module.css";

export function AdminLoginForm({ next }: { next: string }) {
  const emailInput = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"login" | "recovery" | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy("login");
    setError(null);
    setMessage(null);
    try {
      const result = await submitAdminAuth("login", { email, password, next });
      // A full navigation discards protected RSC data cached under the previous session.
      window.location.replace(result.redirectTo);
    } catch (cause) {
      setError(getAdminAuthError(cause));
    } finally {
      setBusy(null);
    }
  }

  async function handlePasswordRecovery() {
    if (busy) return;
    setError(null);
    setMessage(null);
    if (!emailInput.current?.reportValidity() || !email.trim()) {
      emailInput.current?.focus();
      return;
    }
    setBusy("recovery");
    try {
      const result = await submitAdminAuth("recovery", { email });
      setMessage(result.message);
    } catch (cause) {
      setError(getAdminAuthError(cause));
    } finally {
      setBusy(null);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-busy={Boolean(busy)}>
      <div className={styles.field}>
        <label htmlFor="admin-email">관리자 이메일</label>
        <input ref={emailInput} id="admin-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={254} required disabled={Boolean(busy)} value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="admin-password">비밀번호</label>
        <div className={styles.passwordInput}>
          <input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" maxLength={1024} required disabled={Boolean(busy)} value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className={styles.passwordToggle} type="button" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "숨기기" : "표시"}</button>
        </div>
      </div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <button className={styles.primaryButton} type="submit" disabled={Boolean(busy)}>{busy === "login" ? "로그인 중…" : "관리자 로그인"}</button>
      <button className={styles.textButton} type="button" onClick={handlePasswordRecovery} disabled={Boolean(busy)}>{busy === "recovery" ? "메일 요청 중…" : "비밀번호 설정 메일 보내기"}</button>
      {message ? <p className={styles.success} role="status">{message}</p> : null}
    </form>
  );
}
