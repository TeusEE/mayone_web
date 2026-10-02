import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isMockEnrollmentCsvStorageAvailable } from "@/content/mock-class-offers";
import { isLocalAdminHost } from "@/lib/local-admin";
import styles from "./layout.module.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  if (!isMockEnrollmentCsvStorageAvailable() || !isLocalAdminHost(requestHeaders.get("host"))) notFound();

  return (
    <>
      <div className={styles.navigationWrap}>
        <div className={styles.navigation}>
          <Link className={styles.brand} href="/admin">
            <span>MAY.ONE</span>
            <small>LOCAL ADMIN</small>
          </Link>
          <nav aria-label="관리자 메뉴">
            <Link href="/admin">관리 홈</Link>
            <Link href="/admin/enrollments">수강 신청자</Link>
            <Link href="/admin/classes">수강 과목 관리</Link>
          </nav>
        </div>
      </div>
      {children}
    </>
  );
}
