import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import styles from "@/app/content-pages.module.css";

export default function JobNotFound() {
  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <EmptyState kind="unavailable" title="채용 공고를 찾을 수 없습니다." description="공개되지 않았거나 주소가 올바르지 않은 공고입니다." />
      <Link className={styles.textLink} href="/recruit">채용 목록으로 이동</Link>
    </div>
  );
}
