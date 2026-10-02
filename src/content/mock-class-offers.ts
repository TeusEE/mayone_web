import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseMockClassOffers } from "@/lib/mock-class-offers";
import { getSupabaseClassOffers, hasSupabaseStorageConfiguration, isSupabaseStorageConfigured } from "@/lib/supabase-storage";

export function isMockEnrollmentAvailable(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
}

export function isMockEnrollmentCsvStorageAvailable(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function getMockClassOffers() {
  if (hasSupabaseStorageConfiguration()) {
    if (!isSupabaseStorageConfigured()) throw new Error("Supabase 환경변수를 확인해 주세요.");
    return { offers: await getSupabaseClassOffers(), errors: [] as string[] };
  }

  const fixturePath = join(process.cwd(), "src/content/fixtures/class-offers.csv");
  let csv: string;

  if (isMockEnrollmentCsvStorageAvailable()) {
    const localPath = join(process.cwd(), ".local-data", "mock-class-offers.csv");
    try {
      csv = await readFile(localPath, "utf8");
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
      csv = await readFile(fixturePath, "utf8");
    }
  } else {
    csv = await readFile(fixturePath, "utf8");
  }

  return parseMockClassOffers(csv);
}
