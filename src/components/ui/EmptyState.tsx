import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./EmptyState.module.css";

export type EmptyStateKind = "preparing" | "empty" | "no-results" | "unavailable" | "error";

const defaultTitles: Record<EmptyStateKind, string> = {
  preparing: "정보를 준비하고 있습니다.",
  empty: "현재 등록된 정보가 없습니다.",
  "no-results": "조건에 맞는 결과가 없습니다.",
  unavailable: "이 정보는 현재 확인할 수 없습니다.",
  error: "정보를 불러오지 못했습니다.",
};

interface EmptyStateProps {
  kind: EmptyStateKind;
  title?: string;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ kind, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <section className={styles.state} aria-live="polite">
      <h2 className={styles.title}>{title ?? defaultTitles[kind]}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {actionLabel && onAction ? (
        <div className={styles.action}>
          <Button variant="secondary" onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </section>
  );
}
