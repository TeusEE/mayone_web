import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isMockEnrollmentCsvStorageAvailable } from "@/content/mock-class-offers";
import EnrollmentCourseGroup from "@/components/admin/EnrollmentCourseGroup";
import { isLocalAdminHost } from "@/lib/local-admin";
import { groupMockEnrollmentRecordsByCourse, type MockEnrollmentCourseGroup } from "@/lib/mock-enrollment-csv";
import { getMockEnrollmentRecords } from "@/content/mock-enrollments";
import { isSupabaseStorageConfigured } from "@/lib/supabase-storage";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "테스트 신청자 관리",
  description: "개발 환경에서 제출한 수강 신청 테스트 데이터를 확인합니다.",
  robots: { index: false, follow: false },
};

export default async function AdminEnrollmentsPage() {
  const usingSupabase = isSupabaseStorageConfigured();
  const requestHeaders = await headers();
  if (!isMockEnrollmentCsvStorageAvailable() || !isLocalAdminHost(requestHeaders.get("host"))) notFound();

  let courseGroups: MockEnrollmentCourseGroup[] = [];
  let readFailed = false;
  try {
    const records = await getMockEnrollmentRecords();
    courseGroups = groupMockEnrollmentRecordsByCourse(records);
  } catch {
    readFailed = true;
  }
  const recordCount = courseGroups.reduce((count, group) => count + group.records.length, 0);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>MAY.ONE · LOCAL ADMIN</p>
        <h1>수강 신청자</h1>
        <p>테스트 제출 데이터를 확인합니다. 실제 수강 신청이나 접수 내역이 아닙니다.</p>
        <div className={styles.headerLinks}>
          <Link href="/haru/apply">신청 화면</Link>
          <a href="/admin/enrollments">새로고침</a>
        </div>
      </header>

      <aside className={styles.localNotice}>
        <strong>{usingSupabase ? "Supabase 테스트 데이터" : "로컬 전용 테스트 화면"}</strong>
        <p>{usingSupabase ? "신청 기록은 서버에서 Supabase에 저장·조회하며 브라우저에 데이터베이스 키를 보내지 않습니다." : <><code>.local-data/mock-enrollments.csv</code> 파일을 읽습니다. 데이터는 이 컴퓨터의 개발 서버에만 있고 Git에는 포함되지 않습니다.</>}</p>
      </aside>

      {readFailed ? (
        <p className={styles.error} role="alert">신청 데이터를 읽지 못했습니다. Supabase 환경변수·테이블 또는 CSV 파일을 확인해 주세요.</p>
      ) : (
        <section aria-labelledby="records-heading">
          <div className={styles.listHeading}>
            <div>
              <p className={styles.sectionEyebrow}>APPLICATION RECORDS</p>
              <h2 id="records-heading">과정별 신청 현황</h2>
            </div>
            <p><strong>{recordCount}</strong>명 · <strong>{courseGroups.length}</strong>개 과정</p>
          </div>

          {recordCount > 0 ? (
            <div className={styles.courseGroups}>
              {courseGroups.map((group) => <EnrollmentCourseGroup key={group.classId} group={group} />)}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.sectionEyebrow}>NO TEST SUBMISSIONS</p>
              <h3>아직 제출된 테스트 신청이 없습니다.</h3>
              <p>신청 화면에서 임의의 테스트 값으로 제출하면 이곳에서 확인할 수 있습니다.</p>
              <Link href="/haru/apply">테스트 신청 화면으로 이동 <span aria-hidden="true">→</span></Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
