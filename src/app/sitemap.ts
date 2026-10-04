import type { MetadataRoute } from "next";
import {
  getPublicBrandCopy,
  getPublicAcademyClassesForPage,
  getPublicCooperationInstitutions,
  getPublicCooperationPrograms,
  getPublicJobs,
} from "@/content/queries";
import { getSalonDirectoryData } from "@/content/local-branches";
import { getCanonicalSiteUrl, isIndexableDeployment, toSitemapDate } from "@/lib/seo";

function latestDate(values: readonly (string | undefined)[]): Date | undefined {
  return values
    .map(toSitemapDate)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];
}

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getCanonicalSiteUrl();
  if (!siteUrl || !isIndexableDeployment()) return [];

  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, confirmedAt?: string) => {
    entries.push({
      url: new URL(path, siteUrl).toString(),
      ...(toSitemapDate(confirmedAt) ? { lastModified: toSitemapDate(confirmedAt) } : {}),
    });
  };

  const brand = getPublicBrandCopy();
  if (brand) {
    add("/", brand.confirmedAt);
    add("/about", brand.confirmedAt);
  }

  const { branches } = await getSalonDirectoryData();
  if (branches.length > 0) {
    add("/salon", latestDate(branches.map((branch) => branch.confirmedAt))?.toISOString());
  }

  const classes = await getPublicAcademyClassesForPage();
  if (classes.length > 0) {
    add("/haru/classes", latestDate(classes.map((item) => item.confirmedAt))?.toISOString());
    for (const item of classes) add(`/haru/classes/${encodeURIComponent(item.id)}`, item.confirmedAt);
  }

  const programs = getPublicCooperationPrograms();
  const institutions = getPublicCooperationInstitutions();
  if (programs.length > 0 || institutions.length > 0) {
    add("/haru/cooperation", latestDate([...programs, ...institutions].map((item) => item.confirmedAt))?.toISOString());
  }

  const branchIds = new Set(branches.map((branch) => branch.id));
  const jobs = getPublicJobs().filter((job) => branchIds.has(job.branchId));
  if (jobs.length > 0) {
    add("/recruit", latestDate(jobs.map((job) => job.confirmedAt))?.toISOString());
    for (const job of jobs) add(`/recruit/${encodeURIComponent(job.id)}`, job.confirmedAt);
  }

  return entries;
}
