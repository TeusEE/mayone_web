"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MockClassOfferDialog } from "@/components/haru/MockClassOfferDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { canApplyToMockOffer, getMockOfferDisplayStatus, groupMockClassOffersByCategoryAndStartDate, type MockClassOffer } from "@/lib/mock-class-offers";
import type { RecruitmentStatus } from "@/types/content";
import styles from "@/app/content-pages.module.css";
import localStyles from "./MockClassOffersDirectory.module.css";

interface MockClassOffersDirectoryProps {
  offers: readonly MockClassOffer[];
}

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

export function MockClassOffersDirectory({ offers }: MockClassOffersDirectoryProps) {
  const now = new Date();
  const [activeOffer, setActiveOffer] = useState<MockClassOffer | null>(null);
  const offerGroups = groupMockClassOffersByCategoryAndStartDate(offers);

  return (
    <section className={styles.section} aria-labelledby="mock-classes-title">
      <div className={styles.previewNotice} role="note">
        <strong>테스트 과정 · 시연 전용</strong> 실제 개설 교육이 아닙니다. 과정, 강사, 일정, 장소, 교육비는 화면 흐름을 확인하기 위한 가상 정보입니다.
      </div>
      <p className={styles.cardEyebrow}>HARU · MOCK CATALOG</p>
      <h2 className={styles.sectionTitle} id="mock-classes-title">수강 신청 시연 과정</h2>
      <p className={styles.sectionLead}>과정 이름이나 정보 영역을 누르면 상세를 볼 수 있습니다. 신청 가능한 과정만 테스트 신청을 진행할 수 있습니다.</p>

      {offerGroups.length === 0 ? (
        <p className={styles.resultsLine} role="status">표시할 테스트 과정이 없습니다.</p>
      ) : (
        <div className={localStyles.categoryGroups}>
          {offerGroups.map((group) => {
            const headingId = `mock-class-category-${group.category.toLowerCase()}`;

            return (
              <section className={localStyles.categoryGroup} key={group.category} aria-labelledby={headingId}>
                <header className={localStyles.categoryHeading}>
                  <div>
                    <p className={localStyles.categoryEyebrow}>EDUCATION FIELD</p>
                    <h3 id={headingId}>{categoryLabels[group.category]}</h3>
                  </div>
                  <span className={localStyles.categoryCount}>{group.offers.length}개 과정</span>
                </header>
                <div className={styles.cardGrid}>
                  {group.offers.map((offer) => {
                    const status = getMockOfferDisplayStatus(offer, now);
                    const eligible = canApplyToMockOffer(offer, now);
                    const applicationHref = `/haru/apply?classId=${encodeURIComponent(offer.id)}`;

                    return (
                      <article className={styles.card} key={offer.id}>
                        <button
                          aria-haspopup="dialog"
                          aria-label={`${offer.title} 상세 보기 · ${statusLabels[status]}`}
                          className={localStyles.cardTrigger}
                          onClick={() => setActiveOffer(offer)}
                          type="button"
                        >
                          <span className={styles.cardEyebrow}>TEST COURSE</span>
                          <span className={styles.cardTitle}>{offer.title}</span>
                          <span className={styles.badgeRow}>
                            <StatusBadge status={statusKinds[status]} label={statusLabels[status]} />
                            <span>시연 전용</span>
                          </span>
                          <span className={localStyles.summary}>{offer.summary}</span>
                          <span className={localStyles.meta}>
                            <span>일정: {formatDate(offer.startsAt, offer.timeZone)} – {formatDate(offer.endsAt, offer.timeZone)} (한국 시간)</span>
                            <span>강사: {offer.instructorLabel}</span>
                            <span>대상: {offer.audience}</span>
                            <span>장소: {offer.location}</span>
                            <span>교육비: {formatTuition(offer.tuitionKrw)}</span>
                          </span>
                          <span className={localStyles.more}>상세 정보 확인 <span aria-hidden="true">↗</span></span>
                        </button>
                        <div className={styles.cardActions}>
                          {eligible ? (
                            <ButtonLink href={applicationHref}>테스트 신청</ButtonLink>
                          ) : (
                            <Button disabled>{statusLabels[status]} · 신청 불가</Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {activeOffer ? (
        <MockClassOfferDialog
          applicationHref={`/haru/apply?classId=${encodeURIComponent(activeOffer.id)}`}
          detailHref={`/haru/classes/${encodeURIComponent(activeOffer.id)}`}
          key={activeOffer.id}
          offer={activeOffer}
          onClose={() => setActiveOffer(null)}
        />
      ) : null}
    </section>
  );
}
