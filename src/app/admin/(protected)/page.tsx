import type { Metadata } from "next";
import Link from "next/link";
import { getMockClassOffers } from "@/content/mock-class-offers";
import { getAdminBranchCatalog } from "@/content/local-branches";
import { getMockEnrollmentRecords } from "@/content/mock-enrollments";
import { requireAdminPage } from "@/lib/admin-auth";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관리자 홈",
  description: "허용된 MAY.ONE 관리자 전용 관리 화면입니다.",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  await requireAdminPage();
  let applicantCount = 0;
  let applicantReadFailed = false;
  try {
    const records = await getMockEnrollmentRecords();
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

  let publicBranchCount = 0;
  let draftBranchCount = 0;
  let branchCatalogReadFailed = false;
  try {
    const branchRecords = await getAdminBranchCatalog();
    publicBranchCount = branchRecords.filter((branch) => branch.publicationState === "published" && branch.reviewState === "confirmed").length;
    draftBranchCount = branchRecords.length - publicBranchCount;
  } catch {
    branchCatalogReadFailed = true;
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>MAY.ONE · ADMINISTRATION</p>
        <h1>관리자 홈</h1>
        <p>허용된 관리자 계정으로 신청자, 수강 과목과 지점 정보를 관리합니다.</p>
      </header>

      <aside className={styles.notice}>
        <strong>관리자 전용</strong>
        <p>관리 기능은 서버의 관리자 이메일 허용 목록에 등록된 계정만 사용할 수 있습니다. 수강 신청 데이터는 운영 접수 여부와 구분해 확인해 주세요.</p>
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
            <span className={styles.count}>{applicantReadFailed ? "데이터 확인 필요" : `${applicantCount}건 등록`}</span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
          <Link className={styles.menuCard} href="/admin/classes">
            <span className={styles.menuIndex}>02 · CLASS CATALOG</span>
            <strong>수강 과목 관리</strong>
            <span>신청 시연에 사용할 과목을 추가하고 일정과 모집 상태를 관리합니다.</span>
            <span className={styles.count}>{classCatalogReadFailed ? "데이터 확인 필요" : `${classCount}개 과목`}</span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </Link>
          <Link className={styles.menuCard} href="/admin/branches">
            <span className={styles.menuIndex}>03 · BRANCH DIRECTORY</span>
            <strong>지점 관리</strong>
            <span>지점 정보를 수정하고 공개 상태와 운영 정보를 관리합니다.</span>
            <span className={styles.count}>{branchCatalogReadFailed ? "데이터 확인 필요" : `${publicBranchCount}곳 공개 · ${draftBranchCount}곳 초안`}</span>
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
