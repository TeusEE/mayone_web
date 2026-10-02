import type { Metadata } from "next";
import Link from "next/link";
import { join } from "node:path";
import { getMockClassOffers } from "@/content/mock-class-offers";
import { readMockEnrollmentCsv } from "@/lib/mock-enrollment-csv";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관리자 홈",
  description: "로컬 테스트 수강 신청과 교육 과목을 관리합니다.",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  let applicantCount = 0;
  let applicantReadFailed = false;
  try {
    const records = await readMockEnrollmentCsv(join(process.cwd(), ".local-data", "mock-enrollments.csv"));
    applicantCount = records.length;
  } catch {
    applicantReadFailed = true;
  }

  let classCount = 0;
  let classCatalogReadFailed = false;
  try {
    const catalog = await getMockClassOffers();
    classCount = catalog.offers.length;
    classCatalogReadFailed = catalog.errors.length > 0;
  } catch {
    classCatalogReadFailed = true;
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>MAY.ONE · ADMINISTRATION</p>
        <h1>관리자 홈</h1>
        <p>수강 신청 시연에 필요한 신청자와 과목을 관리합니다. 이 화면은 로컬 개발 테스트 전용입니다.</p>
      </header>

      <aside className={styles.notice}>
        <strong>로컬 테스트 관리자</strong>
        <p>데이터는 이 개발 서버의 `.local-data`에 저장됩니다. 실제 수강 신청 접수나 운영 관리자 기능이 아닙니다.</p>
      </aside>

      <section aria-labelledby="admin-menu-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionEyebrow}>ADMIN MENU</p>
          <h2 id="admin-menu-title">관리 메뉴</h2>
        </div>
        <div className={styles.menuGrid}>
          <Link className={styles.menuCard} href="/admin/enrollments">
            <span className={styles.menuIndex}>01 · APPLICATIONS</span>
            <strong>수강 신청자 확인</strong>
            <span>신청 내역과 연락처, 문의 내용을 확인하고 수정·삭제합니다.</span>
            <span className={styles.count}>{applicantReadFailed ? "파일 확인 필요" : `${applicantCount}건 등록`}</span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
          <Link className={styles.menuCard} href="/admin/classes">
            <span className={styles.menuIndex}>02 · CLASS CATALOG</span>
            <strong>수강 과목 관리</strong>
            <span>신청 시연에 사용할 과목을 추가하고 일정과 모집 상태를 관리합니다.</span>
            <span className={styles.count}>{classCatalogReadFailed ? "파일 확인 필요" : `${classCount}개 과목`}</span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <div className={styles.footerLink}>
        <Link href="/">MAY.ONE 홈페이지로 돌아가기 <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
