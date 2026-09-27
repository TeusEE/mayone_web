import styles from "./StatusBadge.module.css";

export type StatusKind = "preparing" | "upcoming" | "open" | "closed" | "ended" | "error";

const statusLabels: Record<StatusKind, string> = {
  preparing: "정보 준비 중",
  upcoming: "모집 예정",
  open: "모집 중",
  closed: "마감",
  ended: "종료",
  error: "확인 필요",
};

interface StatusBadgeProps {
  status: StatusKind;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return <span className={`${styles.badge} ${styles[status]}`}>{label ?? statusLabels[status]}</span>;
}
