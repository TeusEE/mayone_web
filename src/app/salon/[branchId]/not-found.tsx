import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import styles from "@/app/content-pages.module.css";

export default function BranchNotFound() {
  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <EmptyState kind="unavailable" title="지점 정보를 찾을 수 없습니다." description="공개되지 않았거나 주소가 올바르지 않은 지점입니다." />
      <Link className={styles.textLink} href="/salon">지점 목록으로 이동</Link>
    </div>
  );
}
