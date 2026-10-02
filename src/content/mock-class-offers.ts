import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseMockClassOffers } from "@/lib/mock-class-offers";

export function isMockEnrollmentAvailable(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
}

export function isMockEnrollmentCsvStorageAvailable(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function getMockClassOffers() {
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
