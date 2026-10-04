import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAdminIdentityStatus, getAdminLoginPath, getAdminReturnPath, isUnauthenticatedAuthError, normalizeAdminEmail, parseAdminEmailAllowlist } from "@/lib/admin-access";
import { getSupabaseAuthPublicConfig } from "@/lib/supabase/auth-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkSameOriginRequest } from "@/lib/http";
import { checkLocalStorageRequest } from "@/lib/local-storage-access";
import { hasSupabaseStorageConfiguration, isSupabaseAdminEmailAllowed, isSupabaseStorageConfigured } from "@/lib/supabase-storage";

export type AdminAuthStatus =
  | { status: "unconfigured" }
  | { status: "unavailable" }
  | { status: "unauthenticated" }
  | { status: "not-allowlisted"; userId: string; email: string | null }
  | { status: "authorized"; userId: string; email: string | null };

const isProduction = () => process.env.VERCEL_ENV === "production";

export async function isAdminEmailAllowed(value: string | null | undefined): Promise<boolean> {
  const email = normalizeAdminEmail(value);
  if (!email) return false;
  return isProduction()
    ? isSupabaseAdminEmailAllowed(email)
    : parseAdminEmailAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST).has(email);
}

const readAdminAuthStatus = cache(async (): Promise<AdminAuthStatus> => {
  if (!getSupabaseAuthPublicConfig()
    || (isProduction() ? !isSupabaseStorageConfigured() : !parseAdminEmailAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST).size)) {
    return { status: "unconfigured" };
  }

  let identity: { userId: string; email: string | null };
  try {
    const supabase = await createSupabaseServerClient();
    const userResult = await supabase.auth.getUser();
    if (userResult.error) {
      return isUnauthenticatedAuthError(userResult.error)
        ? { status: "unauthenticated" }
        : { status: "unavailable" };
    }
    if (!userResult.data.user) return { status: "unauthenticated" };

    identity = {
      userId: userResult.data.user.id,
      email: userResult.data.user.email ?? null,
    };
  } catch {
    return { status: "unavailable" };
  }
  const { userId, email } = identity;
  let isAllowed: boolean;
  try {
    isAllowed = await isAdminEmailAllowed(email);
  } catch {
    return { status: "unavailable" };
  }
  const status = getAdminIdentityStatus({ userId, email, allowlistedEmails: isAllowed ? new Set([email!.trim().toLowerCase()]) : new Set() });
  return status === "unauthenticated"
    ? { status }
    : { status, userId, email };
});

export async function getAdminAuthStatus(): Promise<AdminAuthStatus> {
  return readAdminAuthStatus();
}

export async function requireAdminPage(): Promise<{ userId: string; email: string | null }> {
  const status = await readAdminAuthStatus();
  const next = getAdminReturnPath((await headers()).get("x-mayone-admin-path"));
  if (status.status === "unauthenticated" || status.status === "unconfigured") {
    redirect(getAdminLoginPath(next));
  }
  if (status.status === "unavailable") redirect(getAdminLoginPath(next, "verification"));
  if (status.status === "not-allowlisted") redirect(getAdminLoginPath(next, "not-allowlisted"));
  return status;
}

export async function checkAdminApiRequest(
  request: Request,
  requiresJson: boolean,
  options: { allowProductionContentChanges?: boolean } = {},
): Promise<Response | null> {
  let status: AdminAuthStatus;
  try {
    status = await readAdminAuthStatus();
  } catch {
    return Response.json(
      { message: "관리자 권한을 확인할 수 없습니다." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const headers = { "Cache-Control": "no-store" };
  if (status.status === "unconfigured") {
    return Response.json({ message: "Supabase Auth 설정을 확인해 주세요." }, { status: 503, headers });
  }
  if (status.status === "unavailable") {
    return Response.json({ message: "관리자 허용 목록을 확인할 수 없습니다." }, { status: 503, headers });
  }
  if (status.status === "unauthenticated") {
    return Response.json({ message: "관리자 로그인이 필요합니다." }, { status: 401, headers });
  }
  if (status.status === "not-allowlisted") {
    return Response.json({ message: "관리자 권한이 없습니다." }, { status: 403, headers });
  }
  const originError = checkSameOriginRequest(request, requiresJson);
  if (originError) return originError;
  if (process.env.VERCEL_ENV === "production") {
    if (!options.allowProductionContentChanges) {
      return Response.json({ message: "이 운영 변경 기능은 아직 사용할 수 없습니다." }, { status: 503, headers });
    }
    return isSupabaseStorageConfigured()
      ? null
      : Response.json({ message: "운영 Supabase 환경변수를 확인해 주세요." }, { status: 503, headers });
  }
  if (hasSupabaseStorageConfiguration()) {
    return isSupabaseStorageConfigured()
      ? null
      : Response.json({ message: "Supabase 환경변수를 확인해 주세요." }, { status: 503, headers });
  }
  return checkLocalStorageRequest(request);
}
