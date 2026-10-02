import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseMockClassOffers, serializeMockClassOffersCsv, type MockClassOffer } from "@/lib/mock-class-offers";

const writeQueues = new Map<string, Promise<void>>();

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
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

  try {
    await writeFile(temporaryPath, serializeMockClassOffersCsv(offers), "utf8");
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

async function withWriteLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const previous = writeQueues.get(filePath) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  const queueTail = current.then(() => undefined, () => undefined);
  writeQueues.set(filePath, queueTail);

  try {
    return await current;
  } finally {
    if (writeQueues.get(filePath) === queueTail) writeQueues.delete(filePath);
  }
}

export async function createMockClassOffer(
  filePath: string,
  fallbackPath: string,
  offer: MockClassOffer,
): Promise<boolean> {
  return withWriteLock(filePath, async () => {
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
  return withWriteLock(filePath, async () => {
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
  return withWriteLock(filePath, async () => {
    const offers = await readCatalog(filePath, fallbackPath);
    const remaining = offers.filter((offer) => offer.id !== classId);
    if (remaining.length === offers.length) return false;

    await writeCatalog(filePath, remaining);
    return true;
  });
}
