import { BranchDirectory } from "@/components/salon/BranchDirectory";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getBranchCollectionState, getPublicBranches } from "@/content/queries";
import { createPageMetadata } from "@/lib/seo";
import styles from "@/app/content-pages.module.css";

export function generateMetadata() {
  return createPageMetadata({
    title: "메이원헤어 지점",
    description: "공개가 확인된 메이원헤어 지점의 지역과 방문 안내를 확인할 수 있습니다.",
    path: "/salon",
    contentAvailable: getPublicBranches().length > 0,
  });
}

export default function SalonDirectoryPage() {
  const branches = getPublicBranches();
  const collectionState = getBranchCollectionState();

  return (
    <div className={styles.page}>
      <SectionHeading eyebrow="MAY.ONE HAIR" title="메이원헤어 지점" description="공개가 확인된 지점의 위치와 방문 안내를 확인할 수 있습니다." />
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
