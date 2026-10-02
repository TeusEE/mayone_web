import { isValidExternalUrl } from "@/lib/actions";
import type { Branch, OperationState, PublicationState } from "@/types/content";

const publicationStates = new Set<PublicationState>(["draft", "published"]);
const operationStates = new Set<OperationState>(["active", "inactive", "unknown"]);
const branchIdPattern = /^[a-z0-9][a-z0-9-]{1,99}$/u;

export interface AdminBranchInput {
  officialName: string;
  publicationState: PublicationState;
  operationState: OperationState;
  region: string;
  address: string;
  introduction: string;
  hours: string;
  closedDays: string;
  phone: string;
  bookingUrl: string;
  placeUrl: string;
  directions: string;
  parking: string;
  amenitiesText: string;
}

export interface AdminBranchInputResult {
  branch?: Branch;
  errors: string[];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function textField(
  input: Record<string, unknown>,
  name: keyof AdminBranchInput,
  label: string,
  maxLength: number,
  errors: string[],
): string {
  const value = input[name];
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    errors.push(`${label} 값은 문자열이어야 합니다.`);
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) errors.push(`${label}은(는) ${maxLength}자 이내로 입력해 주세요.`);
  return trimmed;
}

export function parseAdminBranchInput(
  value: unknown,
  branchId: string,
  existing?: Branch,
  now = new Date(),
): AdminBranchInputResult {
  const input = asRecord(value);
  if (!input) return { errors: ["지점 정보를 확인해 주세요."] };

  const errors: string[] = [];
  if (!branchIdPattern.test(branchId)) errors.push("지점 ID 형식이 올바르지 않습니다.");

  const officialName = textField(input, "officialName", "지점명", 120, errors);
  const region = textField(input, "region", "지역", 80, errors);
  const address = textField(input, "address", "주소", 240, errors);
  const introduction = textField(input, "introduction", "소개", 1000, errors);
  const hours = textField(input, "hours", "운영 시간", 240, errors);
  const closedDays = textField(input, "closedDays", "휴무일", 120, errors);
  const phone = textField(input, "phone", "매장 전화번호", 40, errors);
  const bookingUrl = textField(input, "bookingUrl", "네이버 예약 URL", 500, errors);
  const placeUrl = textField(input, "placeUrl", "네이버 플레이스 URL", 500, errors);
  const directions = textField(input, "directions", "찾아오는 길", 1000, errors);
  const parking = textField(input, "parking", "주차 안내", 300, errors);
  const amenitiesText = textField(input, "amenitiesText", "매장 정보", 1200, errors);

  const publicationState = input.publicationState;
  if (!publicationStates.has(publicationState as PublicationState)) errors.push("공개 상태를 선택해 주세요.");
  const safePublicationState = publicationStates.has(publicationState as PublicationState)
    ? publicationState as PublicationState
    : "draft";

  const operationState = input.operationState;
  if (!operationStates.has(operationState as OperationState)) errors.push("운영 상태를 선택해 주세요.");
  const safeOperationState = operationStates.has(operationState as OperationState)
    ? operationState as OperationState
    : "unknown";

  if (!officialName) errors.push("지점명을 입력해 주세요.");
  if (phone && !/^[0-9+() .-]+$/u.test(phone)) errors.push("전화번호는 숫자와 일반적인 기호로 입력해 주세요.");
  if (bookingUrl && !isValidExternalUrl(bookingUrl)) errors.push("네이버 예약 URL은 사용자 정보가 없는 HTTPS 주소여야 합니다.");
  if (placeUrl && !isValidExternalUrl(placeUrl)) errors.push("네이버 플레이스 URL은 사용자 정보가 없는 HTTPS 주소여야 합니다.");

  if (safePublicationState === "published") {
    if (!region) errors.push("공개 지점에는 지역이 필요합니다.");
    if (!address) errors.push("공개 지점에는 주소가 필요합니다.");
    if (safeOperationState === "unknown") errors.push("공개 지점의 운영 상태를 확인해 주세요.");
  }

  const amenities = amenitiesText
    .split(/\r?\n/u)
    .map((amenity) => amenity.trim())
    .filter(Boolean);
  if (amenities.length > 30) errors.push("매장 정보는 30개 이내로 입력해 주세요.");
  if (amenities.some((amenity) => amenity.length > 100)) errors.push("매장 정보는 항목별 100자 이내로 입력해 주세요.");

  if (errors.length > 0) return { errors };

  const isPublished = safePublicationState === "published";
  const branch: Branch = {
    id: branchId,
    officialName,
    publicationState: safePublicationState,
    reviewState: isPublished ? "confirmed" : "pending",
    ...(isPublished ? { confirmedAt: existing?.confirmedAt ?? now.toISOString() } : {}),
    operationState: safeOperationState,
    ...(region ? { region } : {}),
    ...(address ? { address } : {}),
    ...(introduction ? { introduction } : {}),
    ...(hours ? { hours } : {}),
    ...(closedDays ? { closedDays } : {}),
    ...(phone ? { phone } : {}),
    ...(bookingUrl ? { bookingUrl } : {}),
    ...(placeUrl ? { placeUrl } : {}),
    ...(directions ? { directions } : {}),
    ...(parking ? { parking } : {}),
    ...(amenities.length > 0 ? { amenities } : {}),
    ...(existing?.image ? { image: existing.image } : {}),
  };

  return { branch, errors: [] };
}

export function branchToAdminInput(branch: Branch): AdminBranchInput {
  return {
    officialName: branch.officialName,
    publicationState: branch.publicationState,
    operationState: branch.operationState,
    region: branch.region ?? "",
    address: branch.address ?? "",
    introduction: branch.introduction ?? "",
    hours: branch.hours ?? "",
    closedDays: branch.closedDays ?? "",
    phone: branch.phone ?? "",
    bookingUrl: branch.bookingUrl ?? "",
    placeUrl: branch.placeUrl ?? "",
    directions: branch.directions ?? "",
    parking: branch.parking ?? "",
    amenitiesText: branch.amenities?.join("\n") ?? "",
  };
}
