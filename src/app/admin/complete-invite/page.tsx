import type { Metadata } from "next";
import Link from "next/link";
import { AdminCompleteInviteForm } from "@/components/admin/AdminCompleteInviteForm";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { requireAdminPage } from "@/lib/admin-auth";
import styles from "../auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관리자 비밀번호 설정",
  description: "MAY.ONE 관리자 계정의 초기 비밀번호 설정 및 변경입니다.",
  robots: { index: false, follow: false },
};

export default async function AdminCompleteInvitePage() {
  const identity = await requireAdminPage();

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="admin-password-title">
        <p className={styles.eyebrow}>MAY.ONE · ADMINISTRATION</p>
        <h1 id="admin-password-title">비밀번호 설정</h1>
        <p className={styles.description}>초대·복구 링크로 처음 접속했다면 사용할 비밀번호를 설정해 주세요. 기존 관리자는 이 화면에서 비밀번호를 변경할 수 있습니다.</p>
        <p className={styles.accountEmail}>{identity.email}</p>
        <AdminCompleteInviteForm />
        <div className={styles.accountActions}>
          <Link className={styles.textButton} href="/admin">관리자 홈</Link>
          <AdminSignOutButton className={styles.textButton} />
        </div>
      </section>
    </div>
  );
}
