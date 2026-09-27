"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error("페이지 렌더링 오류", error);
  }, [error]);

  return (
    <section className="pageShell pageShell--narrow" aria-labelledby="error-title">
      <SectionHeading level={1} titleId="error-title" title="페이지를 불러오지 못했습니다." />
      <p className="pageLead">잠시 후 다시 시도해 주세요. 문제가 계속되면 첫 화면으로 이동할 수 있습니다.</p>
      <div className="actionRow">
        <Button onClick={retry} variant="primary">다시 시도</Button>
        <ButtonLink href="/" variant="secondary">첫 화면으로 이동</ButtonLink>
      </div>
    </section>
  );
}
