import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getBrandCopyForDevelopmentReview, getPublicBrandCopy } from "@/content/queries";
import { createPageMetadata } from "@/lib/seo";
import styles from "@/app/content-pages.module.css";

export function generateMetadata() {
  const brand = getPublicBrandCopy();
  return createPageMetadata({
    title: "MAY.ONE 소개",
    description: brand?.home.ecosystem.title ?? "공개 가능한 MAY.ONE 브랜드 소개를 준비하고 있습니다.",
    path: "/about",
    contentAvailable: Boolean(brand),
  });
}

export default function AboutPage() {
  const brand = getBrandCopyForDevelopmentReview();
  if (!brand) {
    return (
      <div className={`${styles.page} ${styles.narrow}`}>
        <SectionHeading eyebrow="ABOUT US · MAY.ONE" title="MAY.ONE 소개" />
        <EmptyState kind="preparing" title="브랜드 정보를 준비하고 있습니다." description="공개 가능한 브랜드 원고를 확인한 뒤 소개합니다." />
      </div>
    );
  }

  const preview = brand.publicationState !== "published" || brand.reviewState !== "confirmed";

  return (
    <div className={styles.page}>
      <SectionHeading
        eyebrow={brand.home.ecosystem.eyebrow}
        title={brand.home.ecosystem.title}
        description={brand.promise}
      />
      {preview ? <p className={styles.previewNotice} role="status">개발 검수용 미승인 브랜드 원고 미리보기 · 공개 페이지에는 확정 콘텐츠만 표시됩니다.</p> : null}
      <div className={styles.cardGrid}>
        {brand.ecosystem.map((item) => (
          <article className={styles.card} key={item.name}>
            <p className={styles.cardEyebrow}>{item.name}</p>
            <h2 className={styles.cardTitle}>{item.title}</h2>
            <p className={styles.muted}>{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
