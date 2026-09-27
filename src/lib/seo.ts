import type { Metadata } from "next";

export interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  contentAvailable: boolean;
}

export function getCanonicalSiteUrl(): URL | undefined {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return undefined;
    }
    return url;
  } catch {
    return undefined;
  }
}

export function isIndexableDeployment(): boolean {
  return process.env.VERCEL_ENV === "production" && Boolean(getCanonicalSiteUrl());
}

export function getRobotsMetadata(contentAvailable: boolean): NonNullable<Metadata["robots"]> {
  const production = isIndexableDeployment();
  return {
    index: production && contentAvailable,
    follow: production,
  };
}

export function createPageMetadata({
  title,
  description,
  path,
  contentAvailable,
}: PageMetadataInput): Metadata {
  const canonicalEnabled = isIndexableDeployment() && contentAvailable;
  const fullTitle = title === "MAY.ONE" || title.endsWith(" | MAY.ONE") ? title : `${title} | MAY.ONE`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: canonicalEnabled ? { canonical: path } : undefined,
    robots: getRobotsMetadata(contentAvailable),
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: "MAY.ONE",
      title: fullTitle,
      description,
      ...(canonicalEnabled ? { url: path } : {}),
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}

export function toSitemapDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : undefined;
}
