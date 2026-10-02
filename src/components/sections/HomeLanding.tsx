import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBrandCopyForDevelopmentReview, getPublicCommonLinks, getPublicJobs } from "@/content/queries";
import { getJobApplicationAvailability, isValidExternalUrl } from "@/lib/actions";
import type { CommonLink } from "@/types/content";
import styles from "./HomeLanding.module.css";

function MarketAction({ link, label, dark = false }: { link: CommonLink | undefined; label: string; dark?: boolean }) {
  const className = dark ? styles.marketAction : styles.closingMarketAction;

  if (link?.url && isValidExternalUrl(link.url)) {
    return <ButtonLink className={className} href={link.url} external variant="secondary">{label}</ButtonLink>;
  }

  return <Button className={className} disabled variant="secondary">{label}</Button>;
}

export async function HomeLanding() {
  const brand = getBrandCopyForDevelopmentReview();

  if (!brand) {
    return (
      <section className={`${styles.preparingPage} pageShell pageShell--narrow`} id="top" aria-labelledby="home-title">
        <p className={styles.eyebrow}>MAY.ONE · OFFICIAL WEBSITE</p>
        <h1 className={styles.preparingTitle} id="home-title">MAY.ONE</h1>
        <EmptyState
          kind="preparing"
          title="메이원 공식 홈페이지를 준비하고 있습니다."
          description="확정된 브랜드 콘텐츠와 운영 자료가 준비되면 홈페이지를 공개합니다."
        />
      </section>
    );
  }

  const isDraftPreview = brand.publicationState !== "published" || brand.reviewState !== "confirmed";
  const publicJobs = getPublicJobs();
  const now = new Date();
  const jobApplication = publicJobs
    .map((item) => getJobApplicationAvailability(item, now))
    .find((availability) => availability.enabled && availability.href);
  const publicLinks = getPublicCommonLinks();
  const marketLink = publicLinks.find((link) => link.purpose === "market");
  const featuredProductLink = publicLinks.find((link) => link.purpose === "featured-product");
  const { home } = brand;

  return (
    <div className={styles.landing}>
      {isDraftPreview ? (
        <p className={styles.previewBanner} role="status">
          개발 검수용 미승인 원고 미리보기 · 운영 정보와 공식 이미지는 확인 후 공개됩니다.
        </p>
      ) : null}

      <section className={styles.hero} id="top" aria-labelledby="home-title">
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{brand.heroEyebrow}</p>
          <h1 id="home-title">{brand.name}</h1>
          <h2>{brand.promise}</h2>
          <p className={styles.lead}>{brand.heroLead}</p>
          <div className={styles.buttonRow}>
            <ButtonLink href="#hair">메이원헤어</ButtonLink>
            <ButtonLink href="#haru" variant="secondary">HARU 교육</ButtonLink>
            <ButtonLink href="#market" variant="secondary">메이원마켓</ButtonLink>
          </div>
        </div>
      </section>

      <section className={styles.section} id="brand-story" aria-labelledby="brand-story-title">
        <div className={styles.inner}>
          <p className={styles.eyebrow}>{home.brandStory.eyebrow}</p>
          <h2 className={styles.sectionTitle} id="brand-story-title">{home.brandStory.title}</h2>
          <p className={styles.copy}>{home.brandStory.description}</p>
          <ol className={styles.flow} aria-label="MAY.ONE 브랜드 성장 구조">
            {brand.growthFlow.map((stage, index) => (
              <li className={styles.flowStep} key={stage}>
                <span className={styles.pill}>{stage}</span>
                {index < brand.growthFlow.length - 1 ? <span className={styles.arrow} aria-hidden="true">→</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${styles.section} ${styles.salonSection}`} id="hair" aria-labelledby="hair-title">
        <div className={`${styles.inner} ${styles.split}`}>
          <div>
            <p className={styles.eyebrow}>{home.salon.eyebrow}</p>
            <h2 className={styles.sectionTitle} id="hair-title">{home.salon.englishTitle}</h2>
            <h3 className={styles.sectionSubTitle}>{home.salon.title}</h3>
            <p className={styles.copy}>{home.salon.description}</p>
            <div className={styles.buttonRowLeft}>
              <ButtonLink href="/salon">지점 찾기</ButtonLink>
              <ButtonLink href="#recruit" variant="secondary">채용 보기</ButtonLink>
            </div>
          </div>
          <div className={styles.hairVisual} aria-hidden="true">
            <span className={styles.visualMark}>MO</span>
            <span className={styles.visualLabel}>MAY.ONE HAIR</span>
            <span className={styles.visualCaption}>Beauty · System · Growth</span>
          </div>
        </div>
      </section>

      <section className={styles.section} id="system" aria-labelledby="system-title">
        <div className={styles.inner}>
          <p className={styles.eyebrow}>{home.system.eyebrow}</p>
          <h2 className={styles.sectionTitle} id="system-title">{home.system.title}</h2>
          <ol className={`${styles.cardGrid} ${styles.systemGrid}`}>
            {brand.growthSystem.map((item) => (
              <li className={styles.card} key={item.name}>
                <span className={styles.cardLabel}>{item.name}</span>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${styles.section} ${styles.alt}`} id="haru" aria-labelledby="haru-title">
        <div className={styles.inner}>
          <p className={styles.eyebrow}>{home.haru.eyebrow}</p>
          <h2 className={styles.haruEnglish} id="haru-title">{home.haru.englishTitle}</h2>
          <h3 className={styles.sectionSubTitle}>{home.haru.title}</h3>
          <p className={styles.copy}>{home.haru.description}</p>

          <ol className={`${styles.cardGrid} ${styles.principleGrid}`}>
            {brand.educationPrinciples.map((item) => (
              <li className={styles.card} key={item.name}>
                <span className={styles.cardLabel}>{item.name}</span>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>

          <ol className={`${styles.cardGrid} ${styles.trackGrid}`}>
            {brand.educationTracks.map((item) => (
              <li className={styles.card} key={item.name}>
                <span className={styles.cardLabel}>{item.name}</span>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>

          <div className={styles.buttonRowLeft}>
            <ButtonLink href="/haru/classes">교육 과정·일정 보기</ButtonLink>
          </div>
          <p className={styles.smallNote}>과정과 모집 일정을 확인한 뒤, 원하는 과정에서 신청을 시작할 수 있습니다.</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.market}`} id="market" aria-labelledby="market-title">
        <div className={`${styles.inner} ${styles.split}`}>
          <div>
            <p className={styles.eyebrow}>{home.market.eyebrow}</p>
            <h2 className={styles.marketTitle} id="market-title">{home.market.englishTitle.replace(" ", "\n")}</h2>
            <h3 className={styles.sectionSubTitle}>{home.market.title}</h3>
            <p className={styles.copy}>{home.market.description}</p>
            <div className={styles.buttonRowLeft}>
              <MarketAction dark link={marketLink} label="메이원마켓 스토어" />
              <MarketAction dark link={featuredProductLink} label="대표 상품 보기" />
            </div>
            <p className={styles.smallNote} role="status">
              {marketLink?.url && isValidExternalUrl(marketLink.url)
                ? featuredProductLink?.url && isValidExternalUrl(featuredProductLink.url)
                  ? "공식 네이버 스마트스토어와 대표 상품으로 연결됩니다. 새 탭에서 열립니다."
                  : "공식 네이버 스마트스토어로 연결됩니다. 대표 상품 링크는 확인 후 활성화합니다. 새 탭에서 열립니다."
                : "공식 스토어 링크를 확인한 뒤 활성화합니다."}
            </p>
          </div>
          <div className={styles.marketVisual} aria-hidden="true">
            <span className={styles.marketVisualMark}>MAY.ONE</span>
            <span className={styles.marketVisualText}>MARKET</span>
            <span className={styles.marketVisualCaption}>OFFICIAL SMART STORE</span>
          </div>
        </div>
      </section>

      <section className={styles.section} id="recruit" aria-labelledby="recruit-title">
        <div className={styles.inner}>
          <p className={styles.eyebrow}>{home.recruit.eyebrow}</p>
          <h2 className={styles.sectionTitle} id="recruit-title">{home.recruit.title}</h2>
          <p className={styles.copy}>{home.recruit.description}</p>
          <ol className={styles.flow} aria-label="MAY.ONE 성장 경로">
            {brand.recruitPath.map((stage, index) => (
              <li className={styles.flowStep} key={stage}>
                <span className={styles.pill}>{stage}</span>
                {index < brand.recruitPath.length - 1 ? <span className={styles.arrow} aria-hidden="true">→</span> : null}
              </li>
            ))}
          </ol>
          <div className={styles.buttonRowLeft}>
            <ButtonLink href="/recruit">채용공고 보기</ButtonLink>
            {jobApplication?.href ? (
              <ButtonLink href={jobApplication.href} external variant="secondary">입사지원</ButtonLink>
            ) : (
              <Button disabled variant="secondary">입사지원</Button>
            )}
          </div>
          {!jobApplication?.href ? <p className={styles.smallNote}>현재 공개된 모집 공고가 없어 지원을 안내할 수 없습니다.</p> : null}
        </div>
      </section>

      <section className={`${styles.section} ${styles.alt}`} id="about" aria-labelledby="about-title">
        <div className={styles.inner}>
          <p className={styles.eyebrow}>{home.ecosystem.eyebrow}</p>
          <h2 className={styles.sectionTitle} id="about-title">{home.ecosystem.title}</h2>
          <ol className={`${styles.cardGrid} ${styles.ecosystemGrid}`}>
            {brand.ecosystem.map((item) => (
              <li className={styles.card} key={item.name}>
                <span className={styles.cardLabel}>{item.name}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.closing} id="next-step" aria-labelledby="closing-title">
        <div className={styles.closingInner}>
          <p className={styles.eyebrow}>{home.closing.eyebrow}</p>
          <h2 id="closing-title">{home.closing.title}</h2>
          <p className={styles.lead}>{home.closing.description}</p>
          <div className={styles.buttonRow}>
            <ButtonLink href="#hair">SALON</ButtonLink>
            <ButtonLink href="#haru" variant="secondary">HARU</ButtonLink>
            <MarketAction link={marketLink} label="MARKET" />
          </div>
          {!(marketLink?.url && isValidExternalUrl(marketLink.url)) ? (
            <p className={styles.smallNote} role="status">공식 마켓 링크를 확인한 뒤 활성화합니다.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
