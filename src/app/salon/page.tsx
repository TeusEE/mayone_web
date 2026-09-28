import { BranchDirectory } from "@/components/salon/BranchDirectory";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getBranchCollectionState, getPublicBranches } from "@/content/queries";
import { createPageMetadata } from "@/lib/seo";
import styles from "@/app/content-pages.module.css";

export function generateMetadata() {
  return createPageMetadata({
    title: "메이원헤어 지점",
    description: "메이원헤어 지점의 주소, 운영시간, 주차, 매장 정보와 네이버 예약 링크를 확인할 수 있습니다.",
    path: "/salon",
    contentAvailable: getPublicBranches().length > 0,
  });
}

export default function SalonDirectoryPage() {
  const branches = getPublicBranches();
  const collectionState = getBranchCollectionState();

  return (
    <div className={styles.page}>
      <SectionHeading eyebrow="MAY.ONE HAIR" title="메이원헤어 지점" description="지점별 위치와 운영 정보를 확인하고, 네이버 예약으로 편리하게 방문을 준비하세요." />
      {branches.length > 0 ? (
        <BranchDirectory branches={branches} />
      ) : (
        <EmptyState
          kind={collectionState === "preparing" ? "preparing" : "empty"}
          title={collectionState === "preparing" ? "지점 정보를 준비하고 있습니다." : "현재 등록된 지점이 없습니다."}
          description={collectionState === "preparing" ? "운영 정보와 예약 안내를 확인한 뒤 공개하겠습니다." : "공개가 확인된 지점이 등록되면 이곳에서 안내합니다."}
        />
      )}
    </div>
  );
}
