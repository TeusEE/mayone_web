import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";

export default function NotFound() {
  return (
    <section className="pageShell pageShell--narrow" aria-labelledby="not-found-title">
      <SectionHeading level={1} titleId="not-found-title" title="페이지를 찾을 수 없습니다." />
      <p className="pageLead">주소를 확인하거나 MAY.ONE 첫 화면으로 이동해 주세요.</p>
      <ButtonLink href="/">첫 화면으로 이동</ButtonLink>
    </section>
  );
}
