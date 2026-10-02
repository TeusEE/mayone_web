import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { canApplyToMockOffer, getMockOfferDisplayStatus, type MockClassOffer } from "@/lib/mock-class-offers";
import type { RecruitmentStatus } from "@/types/content";
import styles from "@/app/content-pages.module.css";

const categoryLabels: Record<MockClassOffer["category"], string> = {
  CUT: "커트",
  PERM: "펌",
  COLOR: "컬러",
  CONSULTING: "디자인 상담",
  SALON_WORK: "살롱 실무",
};

const statusLabels: Record<RecruitmentStatus, string> = {
  upcoming: "모집 예정",
  open: "모집 중",
  closed: "마감",
  completed: "종료",
};

const statusKinds = {
  upcoming: "upcoming",
  open: "open",
  closed: "closed",
  completed: "ended",
} as const;

function formatDate(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTuition(amount: number): string {
  return amount === 0
    ? "무료"
    : new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(amount);
}

export function MockClassOfferDetail({ offer }: { offer: MockClassOffer }) {
  const now = new Date();
  const status = getMockOfferDisplayStatus(offer, now);
  const eligible = canApplyToMockOffer(offer, now);

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <p className="sectionEyebrow">HARU · TEST COURSE · {categoryLabels[offer.category]}</p>
      <h1 className={styles.detailTitle}>{offer.title}</h1>
      <div className={styles.badgeRow}>
        <StatusBadge status={statusKinds[status]} label={statusLabels[status]} />
        <span>테스트 시연용 가상 과정</span>
      </div>
      <aside className={styles.previewNotice} role="note">
        이 과정은 신청 화면의 기능 확인을 위해 만든 가상 정보입니다. 실제 교육 일정이나 모집 공지가 아닙니다.
      </aside>
      <p className={styles.lead}>{offer.summary}</p>

      <section className={styles.section} aria-labelledby="mock-class-details">
        <h2 className={styles.sectionTitle} id="mock-class-details">과정 안내</h2>
        <dl className={styles.infoGrid}>
          <dt>강사</dt><dd>{offer.instructorLabel}</dd>
          <dt>교육 대상</dt><dd>{offer.audience}</dd>
          <dt>일정</dt><dd>{formatDate(offer.startsAt, offer.timeZone)} – {formatDate(offer.endsAt, offer.timeZone)} (한국 시간)</dd>
          <dt>장소</dt><dd>{offer.location}</dd>
          <dt>교육비</dt><dd>{formatTuition(offer.tuitionKrw)}</dd>
          <dt>준비물</dt><dd>{offer.materials || "별도 안내 없음"}</dd>
          <dt>신청 마감</dt><dd>{formatDate(offer.applicationDeadline, offer.timeZone)} (한국 시간)</dd>
          <dt>모집 상태</dt><dd>{statusLabels[status]}</dd>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="mock-class-application">
        <h2 className={styles.sectionTitle} id="mock-class-application">신청 흐름 시연</h2>
        <p className={styles.sectionLead}>실제 신청은 저장되거나 전송되지 않습니다. 신청 화면에서는 실제 개인정보가 아닌 테스트용 임의 값만 입력해 주세요.</p>
        <div className={styles.cardActions}>
          {eligible ? (
            <ButtonLink href={`/haru/apply?classId=${encodeURIComponent(offer.id)}`}>테스트 신청 진행</ButtonLink>
          ) : (
            <Button disabled>{statusLabels[status]} · 신청 불가</Button>
          )}
          <Link className={styles.textLink} href="/haru/classes">교육 목록으로</Link>
        </div>
      </section>
    </div>
  );
}
