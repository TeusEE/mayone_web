"use client";

import { useMemo, useState } from "react";
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
        />
      </div>

      <p className={styles.resultsLine} aria-live="polite">검색 결과 {filtered.length}개</p>
      {filtered.length === 0 ? (
        <EmptyState
          kind="no-results"
          title="조건에 맞는 지점이 없습니다."
          description="지점명이나 지역을 바꿔 다시 검색해 보세요."
        />
      ) : (
        <div className={styles.branchList}>
          {filtered.map((branch, index) => {
            const booking = getBranchBookingAvailability(branch);
            const operationLabel = branch.operationState === "active"
              ? "운영 중"
              : branch.operationState === "inactive"
                ? "운영 종료"
                : "운영 여부 확인 중";
            return (
              <article className={styles.branchListing} key={branch.id}>
                <header className={styles.branchListingHeader}>
                  <div>
                    <p className={styles.branchKicker}>MAY.ONE HAIR · LOCATION {String(index + 1).padStart(2, "0")}</p>
                    <h2 className={styles.branchName}>{branch.officialName}</h2>
                    {branch.region ? <p className={styles.branchRegion}>{branch.region}</p> : null}
                  </div>
                  <StatusBadge status={branch.operationState === "active" ? "open" : branch.operationState === "inactive" ? "closed" : "preparing"} label={operationLabel} />
                </header>

                <dl className={styles.branchInfo}>
                  {branch.address ? <><dt>주소</dt><dd>{branch.address}</dd></> : null}
                  {branch.phone ? <><dt>매장 번호</dt><dd><a href={`tel:${branch.phone}`}>{branch.phone}</a></dd></> : null}
                  {branch.hours ? <><dt>운영 시간</dt><dd>{branch.hours}</dd></> : null}
                  {branch.closedDays ? <><dt>휴무</dt><dd>{branch.closedDays}</dd></> : null}
                  {branch.parking ? <><dt>주차</dt><dd>{branch.parking}</dd></> : null}
                  {branch.directions ? <><dt>찾아가는 길</dt><dd>{branch.directions}</dd></> : null}
                  {branch.amenities?.length ? <><dt>매장 정보</dt><dd>{branch.amenities.join(" · ")}</dd></> : null}
                </dl>

                {branch.image ? <ContentImage image={branch.image} sizes="(max-width: 44rem) 100vw, 70vw" /> : null}

                <div className={styles.branchListingActions}>
                  {booking.enabled && booking.href ? (
                    <ButtonLink className={styles.branchBookingCta} href={booking.href} external ariaLabel={`${branch.officialName} 네이버 예약`}>
                      <span className={styles.naverMark} aria-hidden="true">N</span>
                      네이버 예약
                    </ButtonLink>
                  ) : <Button disabled className={styles.branchBookingCta}>예약 안내 준비 중</Button>}
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
