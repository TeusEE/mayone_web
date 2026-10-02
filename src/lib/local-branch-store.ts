import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { isValidExternalUrl } from "@/lib/actions";
import type { Branch } from "@/types/content";

const writeQueues = new Map<string, Promise<void>>();
const branchIdPattern = /^[a-z0-9][a-z0-9-]{1,99}$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isValidStoredBranch(value: unknown): value is Branch {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" || !branchIdPattern.test(value.id)
    || typeof value.officialName !== "string" || !value.officialName.trim()
    || (value.publicationState !== "draft" && value.publicationState !== "published")
    || (value.reviewState !== "pending" && value.reviewState !== "confirmed")
    || (value.operationState !== "active" && value.operationState !== "inactive" && value.operationState !== "unknown")
  ) return false;

  const stringFields = [
    "confirmedAt", "region", "address", "introduction", "hours", "closedDays", "phone",
    "bookingUrl", "placeUrl", "directions", "parking",
  ] as const;
  if (stringFields.some((field) => !isOptionalString(value[field]))) return false;
  if (typeof value.confirmedAt === "string" && !(/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/u.test(value.confirmedAt) && Number.isFinite(Date.parse(value.confirmedAt)))) return false;
  if (value.publicationState === "published" && (
    value.reviewState !== "confirmed" || !value.confirmedAt
    || typeof value.region !== "string" || !value.region.trim()
    || typeof value.address !== "string" || !value.address.trim()
    || value.operationState === "unknown"
  )) return false;
  if (typeof value.bookingUrl === "string" && value.bookingUrl && !isValidExternalUrl(value.bookingUrl)) return false;
  if (typeof value.placeUrl === "string" && value.placeUrl && !isValidExternalUrl(value.placeUrl)) return false;
  if (value.amenities !== undefined && (!Array.isArray(value.amenities) || value.amenities.some((item) => typeof item !== "string"))) return false;

  if (value.image !== undefined) {
    if (!isRecord(value.image) || typeof value.image.src !== "string" || typeof value.image.alt !== "string") return false;
    if (value.image.width !== undefined && (typeof value.image.width !== "number" || !Number.isFinite(value.image.width) || value.image.width <= 0)) return false;
    if (value.image.height !== undefined && (typeof value.image.height !== "number" || !Number.isFinite(value.image.height) || value.image.height <= 0)) return false;
  }

  return true;
}

export function parseLocalBranchCatalog(source: string): Branch[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("지점 JSON을 읽을 수 없습니다.");
  }

  if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.branches)) {
    throw new Error("지점 JSON의 형식이 올바르지 않습니다.");
  }
  if (parsed.branches.length > 1000) throw new Error("등록 가능한 지점 수를 초과했습니다.");

  const records = parsed.branches;
  if (!records.every(isValidStoredBranch)) throw new Error("지점 JSON의 필수값 또는 필드 형식이 올바르지 않습니다.");
  const ids = new Set<string>();
  for (const branch of records) {
    if (ids.has(branch.id)) throw new Error(`중복 지점 ID가 있습니다: ${branch.id}.`);
    ids.add(branch.id);
  }

  return records;
}

async function readCatalog(filePath: string, fallback: readonly Branch[]): Promise<Branch[]> {
  try {
    return parseLocalBranchCatalog(await readFile(filePath, "utf8"));
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
    return [...fallback];
  }
}

async function writeCatalog(filePath: string, branches: readonly Branch[]): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

  try {
    await writeFile(temporaryPath, `${JSON.stringify({ version: 1, branches }, null, 2)}\n`, "utf8");
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

export async function readLocalBranchCatalog(filePath: string, fallback: readonly Branch[]): Promise<Branch[]> {
  return readCatalog(filePath, fallback);
}

export async function createLocalBranch(filePath: string, fallback: readonly Branch[], branch: Branch): Promise<boolean> {
  return withWriteLock(filePath, async () => {
    const branches = await readCatalog(filePath, fallback);
    if (branches.some((candidate) => candidate.id === branch.id)) return false;
    await writeCatalog(filePath, [...branches, branch]);
    return true;
  });
}

export async function updateLocalBranch(filePath: string, fallback: readonly Branch[], branchId: string, branch: Branch): Promise<boolean> {
  return withWriteLock(filePath, async () => {
    const branches = await readCatalog(filePath, fallback);
    const index = branches.findIndex((candidate) => candidate.id === branchId);
    if (index === -1) return false;

    const updated = [...branches];
    updated[index] = { ...branch, id: branchId };
    await writeCatalog(filePath, updated);
    return true;
  });
}

export async function deleteLocalBranch(filePath: string, fallback: readonly Branch[], branchId: string): Promise<boolean> {
  return withWriteLock(filePath, async () => {
    const branches = await readCatalog(filePath, fallback);
    const remaining = branches.filter((branch) => branch.id !== branchId);
    if (remaining.length === branches.length) return false;

    await writeCatalog(filePath, remaining);
    return true;
  });
}
