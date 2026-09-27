import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "quiet";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  external?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  ariaLabel?: string;
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`${styles.button} ${styles[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
  external = false,
  onClick,
  ariaLabel,
}: ButtonLinkProps) {
  const classes = `${styles.button} ${styles[variant]} ${className}`.trim();

  if (external) {
    return (
      <a className={classes} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} aria-label={ariaLabel ? `${ariaLabel} (새 탭에서 열림)` : undefined}>
        {children}
        <span className="srOnly"> (새 탭에서 열림)</span>
      </a>
    );
  }

  return (
    <Link className={classes} href={href} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
