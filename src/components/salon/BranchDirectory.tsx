"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Branch } from "@/types/content";
import { getBranchBookingAvailability } from "@/lib/actions";
import { filterBranches, getBranchRegions } from "@/lib/filters";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ContentImage } from "@/components/ui/ContentImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExternalLinkNotice } from "@/components/ui/ExternalLinkNotice";
import { FilterSelect, SearchField } from "@/components/ui/FilterFields";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "@/app/content-pages.module.css";

interface BranchDirectoryProps {
  branches: readonly Branch[];
}

export function BranchDirectory({ branches }: BranchDirectoryProps) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const regions = useMemo(() => getBranchRegions(branches), [branches]);
  const filtered = filterBranches(branches, query, region);
  const reset = () => {
    setQuery("");
    setRegion("");
  };

  return (
    <>
      <div className={styles.filters} role="group" aria-label="지점 검색과 필터">
        <SearchField
          id="branch-name"
          label="지점명 검색"
          placeholder="지점명을 입력하세요"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <FilterSelect
          id="branch-region"
          label="지역"
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          options={[{ label: "전체 지역", value: "" }, ...regions.map((item) => ({ label: item, value: item }))]}
          hint="공개 지점에 등록된 지역만 표시합니다."
        />
        <Button type="button" variant="secondary" onClick={reset}>조건 초기화</Button>
      </div>

      <p className={styles.resultsLine} aria-live="polite">검색 결과 {filtered.length}개</p>
      {filtered.length === 0 ? (
        <EmptyState
          kind="no-results"
          title="조건에 맞는 지점이 없습니다."
          description="지점명이나 지역을 바꾸거나 조건을 초기화해 보세요."
          actionLabel="조건 초기화"
          onAction={reset}
        />
      ) : (
        <div className={styles.cardGrid}>
          {filtered.map((branch) => {
            const booking = getBranchBookingAvailability(branch);
            const operationLabel = branch.operationState === "active"
              ? "운영 중"
              : branch.operationState === "inactive"
                ? "운영 종료"
                : "운영 여부 확인 중";
            return (
              <article className={styles.card} key={branch.id}>
                <ContentImage image={branch.image} sizes="(max-width: 44rem) 100vw, 33vw" />
                <h2 className={styles.cardTitle}><Link href={`/salon/${branch.id}`}>{branch.officialName}</Link></h2>
                <ul className={styles.cardMeta}>
                  {branch.region ? <li>{branch.region}</li> : null}
                  {branch.address ? <li>{branch.address}</li> : null}
                </ul>
                <div className={styles.badgeRow}>
                  <StatusBadge status={branch.operationState === "active" ? "open" : branch.operationState === "inactive" ? "closed" : "preparing"} label={operationLabel} />
                </div>
                <ul className={styles.cardMeta}>
                  {branch.hours ? <li>운영 시간: {branch.hours}</li> : null}
                  {branch.closedDays ? <li>휴무: {branch.closedDays}</li> : null}
                </ul>
                <div className={styles.cardActions}>
                  <Link className={styles.textLink} href={`/salon/${branch.id}`}>지점 상세 보기</Link>
                  {booking.enabled && booking.href ? (
                    <ButtonLink href={booking.href} external variant="secondary">예약하기</ButtonLink>
                  ) : <Button disabled variant="secondary">예약 안내 준비 중</Button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {filtered.some((branch) => getBranchBookingAvailability(branch).enabled) ? (
        <ExternalLinkNotice>예약 링크는 공식 외부 예약 서비스가 새 탭에서 열립니다.</ExternalLinkNotice>
      ) : null}
    </>
  );
}
