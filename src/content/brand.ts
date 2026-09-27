import type { BrandContent, ContentCollection } from "@/types/content";

// 원본 홈페이지의 브랜드 원고를 반영한 초안입니다. 최종 확인 전에는 운영 페이지에 공개하지 않습니다.
export const brandCopy: ContentCollection<BrandContent> = {
  sourceState: "pending",
  records: [
    {
      id: "mayone-brand-copy",
      publicationState: "draft",
      reviewState: "pending",
      name: "MAY.ONE",
      promise: "사람을 아름답게, 사람을 성장하게.",
      heroEyebrow: "SALON · EDUCATION · MARKET",
      heroLead: "헤어를 통해 고객의 삶을 변화시키고, 교육을 통해 미용인의 성장을 만들고, 더 나은 미용 산업의 기준을 만들어갑니다.",
      growthFlow: ["SALON", "SYSTEM", "EDUCATION", "ACADEMY", "BUSINESS"],
      growthSystem: [
        { name: "EDUCATION", description: "체계적인 기술 교육과 성장 단계별 프로그램" },
        { name: "CONSULTING", description: "얼굴형·두상·모질을 바탕으로 한 디자인 상담" },
        { name: "MARKETING", description: "디자이너 개인 브랜딩과 고객 유입 시스템" },
        { name: "MANAGEMENT", description: "고객관리와 매장 운영 시스템" },
        { name: "GROWTH", description: "디자이너에서 원장·경영자로 이어지는 성장" },
      ],
      educationPrinciples: [
        { name: "01 BASIC", title: "기본을 이해하는 교육", description: "커트·펌·컬러의 원리를 이해합니다." },
        { name: "02 PRACTICE", title: "반복하는 교육", description: "가발과 모델을 활용해 충분한 실습 경험을 만듭니다." },
        { name: "03 FIELD", title: "현장을 이해하는 교육", description: "상담부터 시술, 고객응대까지 실제 살롱 업무를 경험합니다." },
        { name: "04 GROWTH", title: "성장으로 이어지는 교육", description: "교육 이후 취업과 디자이너 성장까지 연결합니다." },
      ],
      educationTracks: [
        { name: "CUT", description: "여성 · 남성 · 숏 · 디자인커트" },
        { name: "PERM", description: "열펌 · 아이롱펌 · 디자인펌 · 모발진단" },
        { name: "COLOR", description: "컬러이론 · 디자인컬러 · 탈색" },
        { name: "CONSULTING", description: "얼굴형 · 두상 · 모질 · 디자인상담" },
        { name: "SALON WORK", description: "고객응대 · 모델실습 · 고객관리" },
      ],
      ecosystem: [
        { name: "HARU ACADEMY", title: "배운다", description: "기본과 원리를 이해하고 전문 기술과 실무를 배웁니다." },
        { name: "MAY.ONE HAIR", title: "경험한다", description: "실제 고객과 현장에서 경험하며 디자이너로 성장합니다." },
        { name: "MAY.ONE MARKET", title: "확장한다", description: "현장에 필요한 제품과 도구를 통해 전문성을 확장합니다." },
      ],
      recruitPath: ["INTERN", "DESIGNER", "DIRECTOR", "PARTNER"],
      home: {
        brandStory: {
          eyebrow: "ONE BRAND. ONE SYSTEM.",
          title: "하나의 살롱에서\n하나의 미용 생태계로.",
          description: "메이원은 단순한 헤어살롱을 넘어 미용인이 배우고, 현장에서 경험하고, 자신의 가능성을 확장할 수 있는 환경을 만들어갑니다.",
        },
        salon: {
          eyebrow: "MAY.ONE HAIR",
          englishTitle: "BEAUTY BEYOND STYLE",
          title: "아름다움을 만드는 것을 넘어 사람의 성장을 만듭니다.",
          description: "메이원헤어는 고객에게는 더 나은 디자인을, 디자이너에게는 더 큰 성장의 기회를 제공하는 헤어살롱 브랜드입니다. 고객과 디자이너가 함께 성장하는 살롱을 만들어갑니다.",
        },
        system: {
          eyebrow: "MAY.ONE SYSTEM",
          title: "디자이너가 성장해야 브랜드가 성장합니다.",
        },
        haru: {
          eyebrow: "HARU HAIR PROFESSIONAL ACADEMY",
          englishTitle: "Learn. Grow. Lead.",
          title: "배우고, 성장하고, 이끄는 미용인을 만듭니다.",
          description: "HARU 미용사관학교는 학교에서 배운 기본기와 실제 살롱 현장을 연결하는 실무 중심의 미용 교육기관입니다. 기술을 외우는 교육이 아닌, 원리를 이해하고 스스로 응용할 수 있는 교육을 제공합니다.",
        },
        market: {
          eyebrow: "MAY.ONE MARKET",
          englishTitle: "MAY.ONE MARKET",
          title: "메이원마켓의 실제 상품을 만나보세요.",
          description: "메이원헤어와 HARU 미용사관학교에서 이어지는 MAY.ONE의 MARKET입니다. 홈페이지에서는 브랜드와 마켓을 연결하고, 실제 상품 확인과 구매는 공식 네이버 스마트스토어에서 바로 이어집니다.",
        },
        recruit: {
          eyebrow: "GROW WITH MAY.ONE",
          title: "잘할 수 있는\n디자이너를 만듭니다.",
          description: "교육부터 마케팅, 고객관리, 디자이너 브랜딩까지. 혼자 성장하는 것이 아니라 함께 성장할 수 있는 환경을 만듭니다.",
        },
        ecosystem: {
          eyebrow: "EVERYTHING IS CONNECTED.",
          title: "교육과 현장, 그리고 성장을 연결합니다.",
        },
        closing: {
          eyebrow: "MAY.ONE",
          title: "Learn. Grow. Lead.",
          description: "기술을 배우는 사람에서 미용 산업을 이끄는 사람으로.",
        },
      },
    },
  ],
};
