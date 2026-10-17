import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl, isIndexableDeployment } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalSiteUrl();
  if (!siteUrl || !isIndexableDeployment()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/auth/", "/haru/apply", "/haru/classes/preview"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.host,
  };
}
