import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCanonicalSiteUrl, getRobotsMetadata } from "@/lib/seo";
import "./globals.css";

const canonicalSiteUrl = getCanonicalSiteUrl();

export const metadata: Metadata = {
  metadataBase: canonicalSiteUrl,
  title: {
    default: "MAY.ONE",
    template: "%s | MAY.ONE",
  },
  description: "MAY.ONE 공식 웹사이트입니다.",
  applicationName: "MAY.ONE",
  robots: getRobotsMetadata(false),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "MAY.ONE",
    title: "MAY.ONE",
    description: "MAY.ONE 공식 웹사이트입니다.",
  },
  twitter: {
    card: "summary",
    title: "MAY.ONE",
    description: "MAY.ONE 공식 웹사이트입니다.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5ECD9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <a className="skipLink" href="#main-content">본문 바로가기</a>
        <Header />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
