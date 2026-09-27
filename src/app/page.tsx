import { HomeLanding } from "@/components/sections/HomeLanding";
import { getPublicBrandCopy } from "@/content/queries";
import { createPageMetadata } from "@/lib/seo";

export function generateMetadata() {
  const brand = getPublicBrandCopy();
  return createPageMetadata({
    title: brand?.name ?? "공식 홈페이지",
    description: brand?.promise ?? "MAY.ONE 공식 웹사이트의 콘텐츠를 준비하고 있습니다.",
    path: "/",
    contentAvailable: Boolean(brand),
  });
}

export default function HomePage() {
  return <HomeLanding />;
}
