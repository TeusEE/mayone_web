"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { canApplyToMockOffer, getMockOfferDisplayStatus, type MockClassOffer } from "@/lib/mock-class-offers";
import type { RecruitmentStatus } from "@/types/content";
import styles from "./MockClassOfferDialog.module.css";

interface MockClassOfferDialogProps {
  offer: MockClassOffer;
  onClose: () => void;
  onSelect?: () => void;
  selected?: boolean;
  applicationHref?: string;
  detailHref?: string;
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

export function MockClassOfferDialog({
  offer,
  onClose,
  onSelect,
  selected = false,
  applicationHref,
  detailHref,
}: MockClassOfferDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const status = getMockOfferDisplayStatus(offer, new Date());
  const eligible = canApplyToMockOffer(offer, new Date());
  const titleId = `mock-course-dialog-title-${offer.id}`;
  const descriptionId = `mock-course-dialog-description-${offer.id}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function closeDialog() {
    if (dialogRef.current?.open) dialogRef.current.close();
    onClose();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) closeDialog();
  }

  function selectOffer() {
    if (!eligible || selected) return;
    if (dialogRef.current?.open) dialogRef.current.close();
    onSelect?.();
  }

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className={styles.dialog}
      onClick={handleBackdropClick}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>HARU · COURSE DETAILS · TEST ONLY</p>
            <h2 className={styles.title} id={titleId}>{offer.title}</h2>
          </div>
          <button aria-label="과정 상세 모달 닫기" autoFocus className={styles.closeButton} onClick={closeDialog} ref={closeButtonRef} type="button">×</button>
        </header>

        <div className={styles.badges}>
          <span className={styles.category}>{categoryLabels[offer.category]}</span>
          <StatusBadge status={statusKinds[status]} label={statusLabels[status]} />
          <span className={styles.mockBadge}>시연용 가상 과정</span>
        </div>
        <p className={styles.description} id={descriptionId}>{offer.summary}</p>

        <dl className={styles.details}>
          <div><dt>일정</dt><dd>{formatDate(offer.startsAt, offer.timeZone)} – {formatDate(offer.endsAt, offer.timeZone)} (한국 시간)</dd></div>
          <div><dt>강사</dt><dd>{offer.instructorLabel}</dd></div>
          <div><dt>대상</dt><dd>{offer.audience}</dd></div>
          <div><dt>장소</dt><dd>{offer.location}</dd></div>
          <div><dt>교육비</dt><dd>{formatTuition(offer.tuitionKrw)}</dd></div>
          <div><dt>준비물</dt><dd>{offer.materials || "별도 안내 없음"}</dd></div>
          <div><dt>신청 마감</dt><dd>{formatDate(offer.applicationDeadline, offer.timeZone)}</dd></div>
        </dl>

        <p className={styles.notice}>테스트용 가상 과정입니다. 실제 신청은 접수·저장되지 않으며, 입력 화면에는 임의의 테스트 값만 사용해 주세요.</p>
        <footer className={styles.actions}>
          {onSelect ? (
            <Button disabled={!eligible || selected} onClick={selectOffer} type="button">
              {selected ? "이미 선택한 과정입니다" : eligible ? "이 과정 선택" : `${statusLabels[status]} · 신청 불가`}
            </Button>
          ) : applicationHref && eligible ? (
            <ButtonLink href={applicationHref}>테스트 신청하기</ButtonLink>
          ) : (
            <Button disabled>{statusLabels[status]} · 신청 불가</Button>
          )}
          {detailHref ? <ButtonLink href={detailHref} variant="secondary">상세 페이지</ButtonLink> : null}
          <Button onClick={closeDialog} type="button" variant="quiet">닫기</Button>
        </footer>
      </div>
    </dialog>
  );
}
