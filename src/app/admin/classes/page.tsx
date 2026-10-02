import type { Metadata } from "next";
import Link from "next/link";
import { MockClassOfferManager } from "@/components/admin/MockClassOfferManager";
import { getMockClassOffers } from "@/content/mock-class-offers";
import type { MockClassOffer } from "@/lib/mock-class-offers";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "수강 과목 관리",
  description: "로컬 신청 시연에 사용하는 mock 수강 과목을 관리합니다.",
  robots: { index: false, follow: false },
};

export default async function AdminClassesPage() {
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
        <strong>로컬 전용 mock 과목</strong>
        <p><code>.local-data/mock-class-offers.csv</code>에 저장됩니다. 개발 서버에만 반영되며 실제 교육 개설이나 접수로 연결되지 않습니다.</p>
      </aside>

      {readFailed ? (
        <p className={styles.error} role="alert">과목 CSV를 읽지 못했습니다. 저장 파일과 fixture 경로를 확인해 주세요.</p>
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
