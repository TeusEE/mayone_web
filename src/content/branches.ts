import type { Branch, ContentCollection } from "@/types/content";

// 원고의 지점명 후보입니다. 현 운영 여부와 공식 명칭을 확인하기 전까지 초안으로만 둡니다.
const branchNames = [
  "메이원헤어 야당점",
  "메이원헤어 지축점",
  "메이원헤어 야당2점",
  "메이원헤어 분당 미금역점",
  "메이원헤어 성수점",
  "메이원헤어 삼송점",
  "메이원헤어 웨스턴돔점",
  "메이원헤어 운정역점",
  "메이원헤어 천안아산점",
  "메이원헤어 왕십리·행당점",
  "메이원헤어 영등포구청점",
  "메이원헤어 송파 헬리오시티역점",
] as const;

export const branches: ContentCollection<Branch> = {
  sourceState: "pending",
  records: branchNames.map((officialName, index) => ({
    id: `branch-candidate-${String(index + 1).padStart(2, "0")}`,
    publicationState: "draft",
    reviewState: "pending",
    officialName,
    operationState: "unknown",
  })),
};
