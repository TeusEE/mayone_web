import type { Metadata } from "next";
import Link from "next/link";
import { getLocalBranchCatalog } from "@/content/local-branches";
import { BranchManager } from "@/components/admin/BranchManager";
import type { Branch } from "@/types/content";
import { isSupabaseStorageConfigured } from "@/lib/supabase-storage";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "지점 관리",
  description: "로컬 개발 서버에서 지점 정보를 관리합니다.",
  robots: { index: false, follow: false },
};

export default async function AdminBranchesPage() {
  const usingSupabase = isSupabaseStorageConfigured();
  let branchRecords: Branch[] = [];
  let readFailed = false;
  try {
    branchRecords = await getLocalBranchCatalog();
  } catch {
    readFailed = true;
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>MAY.ONE · BRANCH DIRECTORY</p>
        <h1>지점 관리</h1>
        <p>지점의 공개 상태와 위치·운영 정보를 관리합니다. 수정 내용은 지점 페이지에 반영됩니다.</p>
        <Link href="/salon">지점 페이지에서 확인 <span aria-hidden="true">↗</span></Link>
      </header>

      <aside className={styles.notice}>
        <strong>{usingSupabase ? "Supabase 지점 관리" : "로컬 개발 전용 관리"}</strong>
        <p>{usingSupabase ? "지점 정보는 Supabase에 저장됩니다. 확인된 자료만 공개 상태로 설정해 주세요." : <><code>.local-data/branches.json</code>에 저장됩니다. Production의 공개 지점 정보는 이 관리자와 분리되어 있으며, 기존 지점 자료를 확인한 후 공개 상태로 설정해 주세요.</>}</p>
      </aside>

      {readFailed ? (
        <p className={styles.error} role="alert">지점 데이터를 읽지 못했습니다. Supabase 환경변수·테이블 또는 로컬 JSON 형식을 확인해 주세요. 데이터 손실 방지를 위해 현재 편집을 중지했습니다.</p>
      ) : (
        <BranchManager branches={branchRecords} />
      )}
    </div>
  );
}
