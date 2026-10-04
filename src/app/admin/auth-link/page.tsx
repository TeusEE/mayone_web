import Link from "next/link";
import type { Metadata } from "next";
import { AdminAuthLinkHandler } from "@/components/admin/AdminAuthLinkHandler";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "관리자 인증 링크 확인", robots: { index: false, follow: false } };

export default function AdminAuthLinkPage() {
  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="admin-link-title">
        <p className={styles.eyebrow}>MAY.ONE · ADMINISTRATION</p>
        <h1 id="admin-link-title">인증 링크 확인</h1>
        <AdminAuthLinkHandler required />
        <Link className={styles.textButton} href="/admin/login">로그인 화면으로 이동</Link>
      </section>
    </div>
  );
}
