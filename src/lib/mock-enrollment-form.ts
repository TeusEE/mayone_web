import { canApplyToMockOffer, type MockClassOffer } from "@/lib/mock-class-offers";

export interface MockEnrollmentValues {
  name: string;
  phone: string;
  salon: string;
  experience: string;
  inquiry: string;
}

export type MockEnrollmentErrors = Partial<Record<keyof MockEnrollmentValues | "agreement" | "classId", string>>;

export function validateMockEnrollment(
  values: MockEnrollmentValues,
  offer: MockClassOffer | undefined,
  agreed: boolean,
  now = new Date(),
): MockEnrollmentErrors {
  const errors: MockEnrollmentErrors = {};
  const name = values.name.trim();
  const mobileDigits = values.phone.replace(/[^\d]/g, "");

  if (!offer || !canApplyToMockOffer(offer, now)) errors.classId = "신청 가능한 과정을 먼저 선택해 주세요.";
  if (name.length < 2 || name.length > 40) errors.name = "이름을 2자 이상 40자 이하로 입력해 주세요.";
  if (!/^01[016789]\d{7,8}$/.test(mobileDigits)) errors.phone = "대한민국 휴대전화 번호를 확인해 주세요.";
  if (values.salon.length > 80) errors.salon = "근무 매장은 80자 이하로 입력해 주세요.";
  if (values.experience.length > 60) errors.experience = "경력은 60자 이하로 입력해 주세요.";
  if (values.inquiry.length > 500) errors.inquiry = "문의사항은 500자 이하로 입력해 주세요.";
  if (!agreed) errors.agreement = "테스트 입력 안내를 확인해 주세요.";

  return errors;
}
