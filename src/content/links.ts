import type { CommonLink, ContentCollection } from "@/types/content";

// 원자료에 URL이 있으나 최종 목적지와 공개 가능 여부가 확인되지 않았습니다.
export const commonLinks: ContentCollection<CommonLink> = {
  sourceState: "pending",
  records: [
    {
      id: "market-store-candidate",
      publicationState: "draft",
      reviewState: "pending",
      purpose: "market",
      label: "메이원마켓 바로가기",
      url: "https://naver.me/GArimveD",
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
