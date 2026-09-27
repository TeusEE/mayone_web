import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBranchBookingAvailability, getDesignerBookingAvailability } from "@/lib/actions";
import { getDesignerCollectionState, getPublicBranchById, getPublicBranches, getPublicDesigners, getPublicStyles, getStyleCollectionState } from "@/content/queries";
import { createPageMetadata } from "@/lib/seo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ContentImage } from "@/components/ui/ContentImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExternalLinkNotice } from "@/components/ui/ExternalLinkNotice";
import { RelatedListLink } from "@/components/ui/RelatedListLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "@/app/content-pages.module.css";

export function generateStaticParams() {
  return getPublicBranches().map((branch) => ({ branchId: branch.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ branchId: string }> }): Promise<Metadata> {
  const { branchId } = await params;
  const branch = getPublicBranchById(branchId);
  const description = branch?.introduction?.trim() || (
    branch
      ? `${branch.region ? `${branch.region} ` : ""}메이원헤어 지점의 위치와 방문 안내를 확인할 수 있습니다.`
      : "공개가 확인된 메이원헤어 지점 정보를 안내합니다."
  );
  return createPageMetadata({
    title: branch?.officialName ?? "지점 정보",
    description,
    path: `/salon/${encodeURIComponent(branchId)}`,
    contentAvailable: Boolean(branch),
  });
}

export default async function BranchDetailPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = await params;
  const branch = getPublicBranchById(branchId);
  if (!branch) notFound();

  const designers = getPublicDesigners().filter((designer) => designer.branchId === branch.id);
  const stylesForBranch = getPublicStyles().filter((item) => item.branchId === branch.id);
  const booking = getBranchBookingAvailability(branch);
  const designerState = getDesignerCollectionState();
  const styleState = getStyleCollectionState();

  return (
    <div className={styles.page}>
      <SectionHeading eyebrow="MAY.ONE HAIR · SALON" title={branch.officialName} description={branch.region} />
      <div className={styles.detailHero}>
        <div>
          <div className={styles.badgeRow}>
            <StatusBadge
              status={branch.operationState === "active" ? "open" : branch.operationState === "inactive" ? "closed" : "preparing"}
              label={branch.operationState === "active" ? "운영 중" : branch.operationState === "inactive" ? "운영 종료" : "운영 여부 확인 중"}
            />
          </div>
          {branch.introduction ? <div className={styles.bodyCopy}><p>{branch.introduction}</p></div> : null}
          <div className={styles.cardActions}>
            {booking.enabled && booking.href ? <ButtonLink href={booking.href} external>이 지점 예약하기</ButtonLink> : <Button disabled>예약 안내 준비 중</Button>}
            <RelatedListLink href="/salon">지점 목록</RelatedListLink>
          </div>
          {!booking.enabled ? <p className={styles.actionNote}>확정된 예약 경로가 확인되면 안내합니다.</p> : null}
          {booking.enabled ? <ExternalLinkNotice>선택하면 공식 예약 채널이 새 탭에서 열립니다.</ExternalLinkNotice> : null}
        </div>
        <ContentImage image={branch.image} sizes="(max-width: 44rem) 100vw, 40vw" preload />
      </div>

      <section className={styles.section} aria-labelledby="branch-visit-title">
        <h2 className={styles.sectionTitle} id="branch-visit-title">방문 안내</h2>
        <dl className={styles.infoGrid}>
          {branch.region ? <><dt>지역</dt><dd>{branch.region}</dd></> : null}
          {branch.address ? <><dt>주소</dt><dd>{branch.address}</dd></> : null}
          {branch.hours ? <><dt>운영 시간</dt><dd>{branch.hours}</dd></> : null}
          {branch.closedDays ? <><dt>휴무</dt><dd>{branch.closedDays}</dd></> : null}
          {branch.phone ? <><dt>전화</dt><dd><a href={`tel:${branch.phone}`}>{branch.phone}</a></dd></> : null}
          {branch.directions ? <><dt>찾아오시는 길</dt><dd>{branch.directions}</dd></> : null}
        </dl>
        <p className={styles.actionNote}>지도 위치는 확인된 지도 연결 정보가 있을 때만 제공됩니다.</p>
      </section>

      <section className={styles.section} aria-labelledby="branch-designers-title">
        <h2 className={styles.sectionTitle} id="branch-designers-title">디자이너</h2>
        {designers.length > 0 ? (
          <div className={styles.cardGrid}>
            {designers.map((designer) => {
              const designerBooking = getDesignerBookingAvailability(designer, branch);
              return (
                <article className={styles.card} key={designer.id}>
                  <ContentImage image={designer.profileImage} sizes="(max-width: 44rem) 100vw, 25vw" />
                  <h3 className={styles.cardTitle}>{designer.name}</h3>
                  <p className={styles.muted}>{designer.title}</p>
                  <ul className={styles.cardMeta}>{designer.specialties.map((item) => <li key={item}>{item}</li>)}</ul>
                  {designer.introduction ? <p className={styles.muted}>{designer.introduction}</p> : null}
                  {designerBooking.enabled && designerBooking.href ? <div className={styles.cardActions}><ButtonLink href={designerBooking.href} external>디자이너 예약하기</ButtonLink></div> : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            kind={designerState === "preparing" ? "preparing" : "empty"}
            title={designerState === "preparing" ? "디자이너 정보를 준비하고 있습니다." : "이 지점의 공개된 디자이너 정보가 없습니다."}
          />
        )}
        {designers.some((designer) => getDesignerBookingAvailability(designer, branch).enabled) ? (
          <ExternalLinkNotice>디자이너 예약 링크는 공식 외부 예약 서비스가 새 탭에서 열립니다.</ExternalLinkNotice>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="branch-styles-title">
        <h2 className={styles.sectionTitle} id="branch-styles-title">스타일</h2>
        {stylesForBranch.length > 0 ? (
          <div className={styles.cardGrid}>
            {stylesForBranch.map((item) => (
              <article className={styles.card} key={item.id}>
                <ContentImage image={item.image} sizes="(max-width: 44rem) 100vw, 33vw" />
                <p className={styles.sectionLead}>{item.serviceCategory}</p>
                <h3 className={styles.cardTitle}>{item.name}</h3>
                {item.description ? <p className={styles.muted}>{item.description}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            kind={styleState === "preparing" ? "preparing" : "empty"}
            title={styleState === "preparing" ? "스타일 정보를 준비하고 있습니다." : "이 지점의 공개된 스타일 정보가 없습니다."}
          />
        )}
      </section>
    </div>
  );
}
