import type { ContentCollection, CooperationInstitution, CooperationProgram } from "@/types/content";

// 원고에 제안된 프로그램 후보입니다. 실제 운영·협력 사례로 공개하지 않습니다.
export const cooperationPrograms: ContentCollection<CooperationProgram> = {
  sourceState: "pending",
  records: [
    {
      id: "cooperation-candidate-lecture",
      publicationState: "draft",
      reviewState: "pending",
      title: "현장 실무 특강",
      description: "현직 원장·디자이너·전문 강사진의 실무 중심 교육",
    },
    {
      id: "cooperation-candidate-skills",
      publicationState: "draft",
      reviewState: "pending",
      title: "전문 기술 교육",
      description: "커트·펌·컬러 등 살롱 현장에서 요구되는 전문 기술 교육",
    },
    {
      id: "cooperation-candidate-field",
      publicationState: "draft",
      reviewState: "pending",
      title: "현장 경험",
      description: "실제 살롱과 연계한 직무 및 현장 경험",
    },
    {
      id: "cooperation-candidate-employment",
      publicationState: "draft",
      reviewState: "pending",
      title: "취업 연계",
      description: "학생과 현장 살롱을 연결하는 취업 기회",
    },
    {
      id: "cooperation-candidate-joint-program",
      publicationState: "draft",
      reviewState: "pending",
      title: "공동 프로그램",
      description: "세미나·교육·프로젝트 등 산학 프로그램 운영안",
    },
  ],
};

export const cooperationInstitutions: ContentCollection<CooperationInstitution> = {
  sourceState: "pending",
  records: [
    {
      id: "institution-candidate-jeonghwa",
      publicationState: "draft",
      reviewState: "pending",
      name: "정화예술대학교",
      relationshipDescription: "2026년 8월 소개자료에 표기된 기관 후보. 현재 협력·공개 여부 확인 필요.",
    },
  ],
};
