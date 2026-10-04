"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import styles from "@/app/admin/(protected)/layout.module.css";

const menu = [
  { href: "/admin", label: "관리 홈" },
  { href: "/admin/enrollments", label: "수강 신청자" },
  { href: "/admin/classes", label: "수강 과목 관리" },
  { href: "/admin/branches", label: "지점 관리" },
];

export function AdminNavigation({ email }: { email: string | null }) {
  const pathname = usePathname();
  return (
    <div className={styles.navigationWrap}>
      <div className={styles.navigation}>
        <Link className={styles.brand} href="/admin"><span>MAY.ONE</span><small>ADMIN</small></Link>
        <nav aria-label="관리자 메뉴">
          {menu.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}
        </nav>
        <div className={styles.account}>
          <span className={styles.email}>{email}</span>
          <div className={styles.accountActions}>
            <Link href="/admin/complete-invite">비밀번호 설정</Link>
            <AdminSignOutButton className={styles.signOut} />
          </div>
        </div>
      </div>
    </div>
  );
}
