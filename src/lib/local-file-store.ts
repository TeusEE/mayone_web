import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const writeQueues = new Map<string, Promise<void>>();

// Serializes writes within this process; local files are only used in development.
export async function withFileWriteLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const key = resolve(filePath);
  const previous = writeQueues.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  const queueTail = current.then(() => undefined, () => undefined);
  writeQueues.set(key, queueTail);
  try {
    return await current;
  } finally {
    if (writeQueues.get(key) === queueTail) writeQueues.delete(key);
  }
}

export async function writeFileAtomically(filePath: string, contents: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, contents, "utf8");
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}
