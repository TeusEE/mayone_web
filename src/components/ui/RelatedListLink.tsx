import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";

interface RelatedListLinkProps {
  href: string;
  children: ReactNode;
}

export function RelatedListLink({ href, children }: RelatedListLinkProps) {
  return <ButtonLink href={href} variant="secondary">{children}</ButtonLink>;
}
