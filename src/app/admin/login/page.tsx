import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminAuthLinkHandler } from "@/components/admin/AdminAuthLinkHandler";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { getAdminAuthStatus } from "@/lib/admin-auth";
import { getSupabaseAuthPublicConfig } from "@/lib/supabase/auth-config";
import { getAdminReturnPath, parseAdminEmailAllowlist } from "@/lib/admin-access";
import { isSupabaseStorageConfigured } from "@/lib/supabase-storage";
import styles from "../auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관리자 로그인",
  description: "MAY.ONE 관리자 전용 로그인입니다.",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  let status;
  try {
    status = await getAdminAuthStatus();
  } catch {
    status = { status: "unavailable" as const };
  }

  const next = getAdminReturnPath(params.next);
  const authConfigured = Boolean(getSupabaseAuthPublicConfig());
  const accessConfigured = process.env.VERCEL_ENV === "production"
    ? isSupabaseStorageConfigured()
    : Boolean(parseAdminEmailAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST).size);
  const configReady = authConfigured && accessConfigured;
  const notAllowlisted = status.status === "not-allowlisted" || params.error === "not-allowlisted";
  const unavailable = status.status === "unavailable" || params.error === "verification";
  const invalidInvite = params.error === "invite-link";

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="admin-login-title">
        <p className={styles.eyebrow}>MAY.ONE · ADMINISTRATION</p>
        <h1 id="admin-login-title">관리자 로그인</h1>
        <p className={styles.description}>관리자 이메일 허용 목록에 등록된 계정으로 로그인해 주세요.</p>
        {configReady ? <AdminAuthLinkHandler signedIn={status.status === "authorized" && !params.error} next={next} /> : null}
        {!configReady ? (
          <div className={styles.notice} role="alert">
            <strong>관리자 로그인을 준비 중입니다.</strong>
            <p>현재 로그인할 수 없습니다. 사이트 담당자에게 문의해 주세요.</p>
            {authConfigured ? <AdminSignOutButton className={styles.secondaryButton}>현재 세션 로그아웃</AdminSignOutButton> : null}
          </div>
        ) : notAllowlisted ? (
          <div className={styles.notice} role="alert">
            <strong>관리자 권한이 없는 계정입니다.</strong>
            <p>허용 목록에 등록된 계정만 관리자 페이지를 사용할 수 있습니다. 현재 세션에서 로그아웃한 뒤 관리자 계정으로 다시 로그인해 주세요.</p>
            <AdminSignOutButton className={styles.secondaryButton}>로그아웃</AdminSignOutButton>
          </div>
        ) : unavailable ? (
          <div className={styles.notice} role="alert">
            <strong>관리자 인증을 확인하지 못했습니다.</strong>
            <p>잠시 후 다시 시도해 주세요. 문제가 계속되면 사이트 담당자에게 문의해 주세요.</p>
            <Link className={styles.secondaryButton} href={`/admin/login?next=${encodeURIComponent(next)}`}>다시 시도</Link>
          </div>
        ) : status.status === "authorized" && !invalidInvite ? (
          <div className={styles.notice}>
            <strong>관리자 계정으로 로그인되어 있습니다.</strong>
            <Link className={styles.primaryButton} href={next}>관리자 화면으로 이동</Link>
            <AdminSignOutButton className={styles.secondaryButton} />
          </div>
        ) : (
          <>
            {invalidInvite ? (
              <div className={styles.notice} role="alert">
                <strong>인증 링크를 확인해 주세요.</strong>
                <p>링크가 만료되었거나 이미 처리되었습니다. 아래에서 비밀번호 설정 메일을 다시 요청할 수 있습니다.</p>
              </div>
            ) : null}
            <AdminLoginForm next={next} />
          </>
        )}
        <p className={styles.footnote}>일반 회원가입은 제공하지 않습니다. 로그인은 관리자 화면에만 적용됩니다.</p>
        <Link className={styles.textButton} href="/">홈페이지로 돌아가기</Link>
      </section>
    </div>
  );
}
