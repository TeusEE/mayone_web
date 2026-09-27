"use client";

import { useCallback, useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

interface TimeBoundActionProps {
  eligible: boolean;
  href?: string;
  expiresAt?: string;
  label: string;
  disabledReason: string;
}

function isExpired(expiresAt: string | undefined, now: number): boolean {
  if (!expiresAt) return false;
  const cutoff = Date.parse(expiresAt);
  return !Number.isFinite(cutoff) || now >= cutoff;
}

export function TimeBoundAction({
  eligible,
  href,
  expiresAt,
  label,
  disabledReason,
}: TimeBoundActionProps) {
  const [verification, setVerification] = useState<{ key: string; active: boolean } | null>(null);
  const checkKey = `${eligible}:${href ?? ""}:${expiresAt ?? ""}`;
  const checked = verification?.key === checkKey;
  const active = checked && Boolean(verification?.active);

  const refresh = useCallback(() => {
    setVerification({ key: checkKey, active: Boolean(eligible && href && !isExpired(expiresAt, Date.now())) });
  }, [checkKey, eligible, expiresAt, href]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const initialCheck = setTimeout(refresh, 0);
    const scheduleExpiryCheck = () => {
      if (!expiresAt) return;
      const cutoff = Date.parse(expiresAt);
      if (!Number.isFinite(cutoff)) return;
      const remaining = cutoff - Date.now();
      if (remaining <= 0) {
        timeout = setTimeout(refresh, 0);
        return;
      }
      timeout = setTimeout(scheduleExpiryCheck, Math.min(remaining + 25, 2_147_000_000));
    };

    const onResume = () => {
      if (document.visibilityState === "visible") refresh();
    };
    scheduleExpiryCheck();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onResume);

    return () => {
      clearTimeout(initialCheck);
      if (timeout) clearTimeout(timeout);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, [expiresAt, refresh]);

  const blockIfExpired = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!eligible || !href || isExpired(expiresAt, Date.now())) {
      event.preventDefault();
      setVerification({ key: checkKey, active: false });
    }
  };

  if (!eligible || !href || !checked || !active) {
    const message = !checked ? "신청 상태 확인 중" : eligible ? "신청 기간이 종료되었습니다" : disabledReason;
    return <Button disabled>{message}</Button>;
  }

  return (
    <ButtonLink
      href={href}
      external
      onClick={blockIfExpired}
      ariaLabel={label}
    >
      {checked && active ? label : "신청 상태 확인 중"}
    </ButtonLink>
  );
}
