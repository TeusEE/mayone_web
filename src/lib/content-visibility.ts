import type { ContentCollection, ContentRecord, CollectionDisplayState } from "@/types/content";

export function isPublicRecord<T extends ContentRecord>(record: T): boolean {
  return record.publicationState === "published" && record.reviewState === "confirmed";
}

export function getPublicRecords<T extends ContentRecord>(collection: ContentCollection<T>): T[] {
  return collection.records.filter(isPublicRecord);
}

export function getCollectionState<T extends ContentRecord>(
  collection: ContentCollection<T>,
): CollectionDisplayState {
  if (
    collection.sourceState === "pending" ||
    collection.records.some((record) => !isPublicRecord(record))
  ) {
    return "preparing";
  }

  return getPublicRecords(collection).length > 0 ? "available" : "empty";
}
