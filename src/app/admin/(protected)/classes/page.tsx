import type { Metadata } from "next";
import Link from "next/link";
import { AcademyClassManager } from "@/components/admin/AcademyClassManager";
import { MockClassOfferManager } from "@/components/admin/MockClassOfferManager";
import { getMockClassOffers, isMockEnrollmentAvailable } from "@/content/mock-class-offers";
import type { MockClassOffer } from "@/lib/mock-class-offers";
import { getSupabaseAcademyClasses, isSupabaseStorageConfigured } from "@/lib/supabase-storage";
import type { AcademyClass } from "@/types/content";
import { requireAdminPage } from "@/lib/admin-auth";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "수강 과목 관리",
  description: "수강 신청 시연에 사용하는 과정 정보를 관리합니다.",
  robots: { index: false, follow: false },
};

export default async function AdminClassesPage() {
  await requireAdminPage();
  if (process.env.VERCEL_ENV === "production") {
    let classes: AcademyClass[] = [];
    let readFailed = false;
    try {
      if (!isSupabaseStorageConfigured()) throw new Error("운영 Supabase가 설정되지 않았습니다.");
      classes = await getSupabaseAcademyClasses();
    } catch {
      readFailed = true;
    }
    return <div className={styles.page}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>MAY.ONE · CLASS CATALOG</p>
        <h1>수강 과목 관리</h1>
        <p>운영 과정과 일정을 관리합니다. 초안은 비공개로 저장되고, 공개 상태인 과정만 교육 일정에 표시됩니다.</p>
        <Link href="/haru/classes">교육 일정 화면에서 확인 <span aria-hidden="true">↗</span></Link>
      </header>
      <aside className={styles.notice}>
        <strong>운영 교육 과정</strong>
        <p>변경 내용은 운영 Supabase에 저장됩니다. 실제 교육 정보를 확인한 뒤 공개 상태로 설정해 주세요. 수강 신청은 외부 공식 신청 주소로 연결됩니다.</p>
      </aside>
      {readFailed ? <p className={styles.error} role="alert">운영 과정 데이터를 읽지 못했습니다. Supabase 환경변수와 테이블을 확인해 주세요. 데이터 손실 방지를 위해 편집을 중지했습니다.</p>
        : <AcademyClassManager classes={classes} />}
    </div>;
  }
  if (!isMockEnrollmentAvailable()) {
    return <div className={styles.page}>
      <header className={styles.heading}><h1>수강 과목 관리</h1></header>
      <aside className={styles.notice}>
        <strong>운영 과정 관리 준비 중</strong>
        <p>공개 과정의 데이터 모델과 관리자 DB 권한 검증이 완료되면 운영 과정 관리를 제공합니다.</p>
      </aside>
    </div>;
  }
  const usingSupabase = isSupabaseStorageConfigured();
  let offers: MockClassOffer[] = [];
  let catalogErrors: string[] = [];
  let readFailed = false;
  try {
    const catalog = await getMockClassOffers();
    offers = catalog.offers;
    catalogErrors = catalog.errors;
  } catch {
    readFailed = true;
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>MAY.ONE · CLASS CATALOG</p>
        <h1>수강 과목 관리</h1>
        <p>테스트용 과목을 등록하면 수강 신청 시연 목록에 반영됩니다. 모집 중인 과목은 신청 흐름까지 확인할 수 있습니다.</p>
        <Link href="/haru/classes">교육 일정 화면에서 확인 <span aria-hidden="true">↗</span></Link>
      </header>

      <aside className={styles.notice}>
        <strong>{usingSupabase ? "Supabase 테스트 과목" : "로컬 전용 mock 과목"}</strong>
        <p>{usingSupabase ? "과목은 Supabase에 저장되어 교육 일정과 신청 화면에 반영됩니다. 실제 교육 개설이나 접수로 연결되지는 않습니다." : <><code>.local-data/mock-class-offers.csv</code>에 저장됩니다. 개발 서버에만 반영되며 실제 교육 개설이나 접수로 연결되지 않습니다.</>}</p>
      </aside>

      {readFailed ? (
          <p className={styles.error} role="alert">과목 데이터를 읽지 못했습니다. Supabase 환경변수·테이블 또는 로컬 파일을 확인해 주세요.</p>
      ) : catalogErrors.length > 0 ? (
        <div className={styles.error} role="alert">
          <strong>과목 CSV를 확인해 주세요.</strong>
          <ul>{catalogErrors.map((error) => <li key={error}>{error}</li>)}</ul>
          <p>데이터 손실을 막기 위해 CSV 오류를 해결할 때까지 수정 기능을 잠시 중지했습니다.</p>
        </div>
      ) : (
        <MockClassOfferManager offers={offers} />
      )}
    </div>
  );
}
