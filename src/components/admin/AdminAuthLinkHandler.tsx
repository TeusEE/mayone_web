"use client";

import { useEffect, useRef, useState } from "react";
import { getAdminReturnPath } from "@/lib/admin-access";
import { getAdminAuthError, submitAdminAuth } from "@/lib/admin-auth-client";
import styles from "@/app/admin/auth.module.css";

export function AdminAuthLinkHandler({ required = false, signedIn = false, next = "/admin", publicEntry = false }: { required?: boolean; signedIn?: boolean; next?: string; publicEntry?: boolean }) {
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleAuthLink() {
      if (started.current) return;
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const type = params.get("type");
      // Dashboard invitations may use the Site URL. Leave normal homepage anchors alone.
      if (publicEntry && !params.has("access_token") && !params.has("refresh_token") &&
          !params.has("error_code") && type !== "invite" && type !== "recovery") return;
      started.current = true;
      if (hash) {
        // Keep even malformed/expired auth fragments out of the address and history.
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
      }
      if (!hash) {
        if (required) window.location.replace("/admin/login?error=invite-link");
        else if (signedIn) window.location.replace(getAdminReturnPath(next));
        return;
      }
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if ((type !== "invite" && type !== "recovery") || !accessToken || !refreshToken || params.has("error")) {
        window.location.replace("/admin/login?error=invite-link");
        return;
      }
      void submitAdminAuth("session", { type, accessToken, refreshToken })
        .then((result) => window.location.replace(result.redirectTo))
        .catch((cause) => setError(getAdminAuthError(cause)));
    }
    handleAuthLink();
    if (publicEntry) {
      window.addEventListener("hashchange", handleAuthLink);
      return () => window.removeEventListener("hashchange", handleAuthLink);
    }
  }, [required, signedIn, next, publicEntry]);

  if (error) return <p className={styles.error} role="alert">{error} 로그인 화면에서 비밀번호 설정 메일을 다시 요청할 수 있습니다.</p>;
  return required || signedIn ? <p className={styles.help} role="status">인증 상태를 확인하고 이동 중입니다…</p> : null;
}
