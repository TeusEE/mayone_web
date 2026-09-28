import type { CommonLink, ContentCollection } from "@/types/content";

// 공식 스토어 주소는 운영 담당자가 제공했습니다. 대표 상품·소셜 링크는 별도 확인 전까지 공개하지 않습니다.
export const commonLinks: ContentCollection<CommonLink> = {
  sourceState: "pending",
  records: [
    {
      id: "market-store-official",
      publicationState: "published",
      reviewState: "confirmed",
      confirmedAt: "2026-09-28T20:00:00+09:00",
      purpose: "market",
      label: "메이원마켓 공식 스마트스토어",
      url: "https://smartstore.naver.com/mayone-market",
    },
    {
      id: "market-product-candidate",
      publicationState: "draft",
      reviewState: "pending",
      purpose: "featured-product",
      label: "대표 상품 보기",
      url: "https://naver.me/FM9zFgIA",
    },
    {
      id: "haru-instagram-candidate",
      publicationState: "draft",
      reviewState: "pending",
      purpose: "social",
      label: "HARU 미용사관학교 Instagram",
      candidateValue: "@haru_hair_academy (2026년 8월 소개자료 표기, 계정 확인 필요)",
    },
    {
      id: "mayone-instagram-candidate",
      publicationState: "draft",
      reviewState: "pending",
      purpose: "social",
      label: "MAY.ONE Instagram",
      candidateValue: "@may.one_hair (콘텐츠 원자료 표기, 공식 URL 확인 필요)",
    },
  ],
};
