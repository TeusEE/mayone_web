import { withFileWriteLock, writeFileAtomically } from "@/lib/local-file-store";
import { readFile } from "node:fs/promises";
import { parseMockClassOffers, serializeMockClassOffersCsv, type MockClassOffer } from "@/lib/mock-class-offers";

async function readCatalog(filePath: string, fallbackPath: string): Promise<MockClassOffer[]> {
  let csv: string;
  try {
    csv = await readFile(filePath, "utf8");
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
    csv = await readFile(fallbackPath, "utf8");
  }

  const result = parseMockClassOffers(csv);
  if (result.errors.length > 0) throw new Error(result.errors.join(" "));
  return result.offers;
}

async function writeCatalog(filePath: string, offers: readonly MockClassOffer[]): Promise<void> {
  await writeFileAtomically(filePath, serializeMockClassOffersCsv(offers));
}

export async function createMockClassOffer(
  filePath: string,
  fallbackPath: string,
  offer: MockClassOffer,
): Promise<boolean> {
  return withFileWriteLock(filePath, async () => {
    const offers = await readCatalog(filePath, fallbackPath);
    if (offers.some((candidate) => candidate.id === offer.id)) return false;
    await writeCatalog(filePath, [...offers, offer]);
    return true;
  });
}

export async function updateMockClassOffer(
  filePath: string,
  fallbackPath: string,
  classId: string,
  offer: MockClassOffer,
): Promise<boolean> {
  return withFileWriteLock(filePath, async () => {
    const offers = await readCatalog(filePath, fallbackPath);
    const index = offers.findIndex((candidate) => candidate.id === classId);
    if (index === -1) return false;

    const updated = [...offers];
    updated[index] = { ...offer, id: classId, isMock: true };
    await writeCatalog(filePath, updated);
    return true;
  });
}

export async function deleteMockClassOffer(
  filePath: string,
  fallbackPath: string,
  classId: string,
): Promise<boolean> {
  return withFileWriteLock(filePath, async () => {
    const offers = await readCatalog(filePath, fallbackPath);
    const remaining = offers.filter((offer) => offer.id !== classId);
    if (remaining.length === offers.length) return false;

    await writeCatalog(filePath, remaining);
    return true;
  });
}
