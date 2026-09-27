import type { ContentCollection, Instructor } from "@/types/content";

// 원자료는 강사진 후보의 이름·역할·공개 범위를 확정하지 않습니다.
export const instructors: ContentCollection<Instructor> = {
  sourceState: "pending",
  records: [],
};
