import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExternalLinkNotice } from "@/components/ui/ExternalLinkNotice";
import { RelatedListLink } from "@/components/ui/RelatedListLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getCooperationCollectionState,
  getPublicCommonLinks,
  getPublicCooperationInstitutions,
  getPublicCooperationPrograms,
} from "@/content/queries";
import { isValidExternalUrl } from "@/lib/actions";
import { createPageMetadata } from "@/lib/seo";
import styles from "@/app/content-pages.module.css";

export function generateMetadata() {
  const available = getPublicCooperationPrograms().length > 0 || getPublicCooperationInstitutions().length > 0;
  return createPageMetadata({
    title: "HARU 산학협력",
    description: "공개가 확인된 산학협력 프로그램과 공식 문의 안내를 확인할 수 있습니다.",
    path: "/haru/cooperation",
    contentAvailable: available,
  });
}

export default function CooperationPage() {
  const programs = getPublicCooperationPrograms();
  const institutions = getPublicCooperationInstitutions();
  const state = getCooperationCollectionState();
  const inquiryLink = getPublicCommonLinks().find((link) => link.purpose === "cooperation-inquiry" && isValidExternalUrl(link.url));

  return (
    <div className={styles.page}>
      <SectionHeading
        eyebrow="HARU · COOPERATION"
        title="산학협력"
        description="공개가 확인된 프로그램과 공식 문의 안내를 확인할 수 있습니다."
      />

      <section className={styles.section} aria-labelledby="cooperation-programs-title">
        <h2 className={styles.sectionTitle} id="cooperation-programs-title">프로그램</h2>
        {programs.length > 0 ? (
          <div className={styles.cardGrid}>
            {programs.map((program) => (
              <article className={styles.card} key={program.id}>
                <h3 className={styles.cardTitle}>{program.title}</h3>
                <p className={styles.muted}>{program.description}</p>
                {program.audience ? <p className={styles.muted}>대상: {program.audience}</p> : null}
                {program.inquiryUrl && isValidExternalUrl(program.inquiryUrl) ? (
                  <div className={styles.cardActions}><ButtonLink href={program.inquiryUrl} external>프로그램 문의</ButtonLink></div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            kind={state === "preparing" ? "preparing" : "empty"}
            title={state === "preparing" ? "협력 프로그램을 준비하고 있습니다." : "현재 공개된 협력 프로그램이 없습니다."}
            description={state === "preparing" ? "운영 내용과 참여 정보를 확인한 뒤 공개하겠습니다." : undefined}
          />
        )}
        {programs.some((program) => isValidExternalUrl(program.inquiryUrl)) ? (
          <ExternalLinkNotice>프로그램별 문의 링크는 공식 외부 채널이 새 탭에서 열립니다.</ExternalLinkNotice>
        ) : null}
      </section>

      {institutions.length > 0 ? (
        <section className={styles.section} aria-labelledby="cooperation-institutions-title">
          <h2 className={styles.sectionTitle} id="cooperation-institutions-title">협력 기관</h2>
          <div className={styles.cardGrid}>
            {institutions.map((institution) => (
              <article className={styles.card} key={institution.id}>
                <h3 className={styles.cardTitle}>{institution.name}</h3>
                <p className={styles.muted}>{institution.relationshipDescription}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {inquiryLink?.url ? (
        <section className={styles.section} aria-labelledby="cooperation-contact-title">
          <h2 className={styles.sectionTitle} id="cooperation-contact-title">공식 문의</h2>
          <ButtonLink href={inquiryLink.url} external>{inquiryLink.label}</ButtonLink>
          <ExternalLinkNotice>선택하면 공식 문의 채널이 새 탭에서 열립니다.</ExternalLinkNotice>
        </section>
      ) : null}

      <div className={styles.cardActions}><RelatedListLink href="/haru/classes">HARU 교육 일정 보기</RelatedListLink></div>
    </div>
  );
}
