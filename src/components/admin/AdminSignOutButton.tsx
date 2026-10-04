"use client";

import { useState } from "react";
import { getAdminAuthError, submitAdminAuth } from "@/lib/admin-auth-client";
import styles from "@/app/admin/auth.module.css";

export function AdminSignOutButton({ className, children = "로그아웃" }: { className?: string; children?: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await submitAdminAuth("logout", {});
      window.location.replace(result.redirectTo);
    } catch (cause) {
      setError(getAdminAuthError(cause));
    } finally {
      setBusy(false);
    }
  }

  return <div className={styles.signOutGroup}>
    <button className={className} type="button" onClick={signOut} disabled={busy}>{busy ? "로그아웃 중…" : children}</button>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </div>;
}
