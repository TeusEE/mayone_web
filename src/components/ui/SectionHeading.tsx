import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
  titleId?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  level = 1,
  className = "",
  titleId,
}: SectionHeadingProps) {
  const Heading = `h${level}` as const;

  return (
    <div className={`sectionHeading ${className}`.trim()}>
      {eyebrow ? <p className="sectionEyebrow">{eyebrow}</p> : null}
      <Heading className="sectionTitle" id={titleId}>{title}</Heading>
      {description ? <div className="sectionDescription">{description}</div> : null}
    </div>
  );
}
