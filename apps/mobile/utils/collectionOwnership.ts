import type { CardListItem } from '@riftbound/contracts';
import { collectionFinishKey } from '@riftbound/contracts';
import type { CollectionEntry } from '@/services/collectionService';

export type CollectionOwnershipMap = ReadonlyMap<string, { quantity: number }>;

export function collectVariantNumbers(
  cards: readonly CardListItem[],
  extraVariantNumbers: readonly string[] = []
): string[] {
  const variants = new Set<string>();
  for (const card of cards) {
    for (const printing of card.printings ?? [{ variantNumber: card.variantNumber }]) {
      variants.add(printing.variantNumber);
    }
  }
  for (const variantNumber of extraVariantNumbers) {
    if (variantNumber) variants.add(variantNumber);
  }
  return [...variants];
}

export function ownershipRecordFromCollection(
  entries: readonly CollectionEntry[]
): Record<string, number> {
  const record: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.quantity > 0) {
      const key = collectionFinishKey(entry.variantNumber, entry.isFoil);
      record[key] = (record[key] ?? 0) + entry.quantity;
      // Also keep plain VN total for callers that still sum by variant number.
      record[entry.variantNumber] = (record[entry.variantNumber] ?? 0) + entry.quantity;
    }
  }
  return record;
}

export function ownershipMapFromCollection(
  entries: readonly CollectionEntry[]
): CollectionOwnershipMap {
  return ownershipMapFromRecord(ownershipRecordFromCollection(entries));
}

export function ownershipMapFromRecord(
  record: Readonly<Record<string, number>>
): CollectionOwnershipMap {
  const map = new Map<string, { quantity: number }>();
  for (const [key, quantity] of Object.entries(record)) {
    if (quantity > 0) {
      map.set(key, { quantity });
    }
  }
  return map;
}

export function ownershipRecordFromQuantityRows(
  rows: ReadonlyArray<{ variantNumber: string; isFoil: boolean; quantity: number }>
): Record<string, number> {
  const record: Record<string, number> = {};
  for (const row of rows) {
    const key = collectionFinishKey(row.variantNumber, row.isFoil);
    record[key] = row.quantity;
    record[row.variantNumber] = (record[row.variantNumber] ?? 0) + row.quantity;
  }
  return record;
}

/** Overlay collection-list ownership onto quantities map — collection wins (optimistic), ownership can lag. */
export function preferCollectionOwnership(
  ownership: CollectionOwnershipMap,
  fromCollection: CollectionOwnershipMap
): CollectionOwnershipMap {
  if (fromCollection.size === 0) return ownership;
  if (ownership.size === 0) return fromCollection;
  const merged = new Map(ownership);
  for (const [variantNumber, entry] of fromCollection) {
    merged.set(variantNumber, entry);
  }
  return merged;
}

/** Merge ownership patches; keep zeros as known-unowned so tiles skip re-fetch after invalidation. */
export function mergeOwnershipRecords(
  base: Readonly<Record<string, number>>,
  patch: Readonly<Record<string, number>>
): Record<string, number> {
  const next = { ...base };
  for (const [variantNumber, quantity] of Object.entries(patch)) {
    next[variantNumber] = Math.max(0, quantity);
  }
  return next;
}

/** Apply full collection snapshot onto ownership cache without wiping known-zero never-owned variants. */
export function mergeOwnershipFromCollection(
  current: Readonly<Record<string, number>>,
  entries: readonly CollectionEntry[]
): Record<string, number> {
  const fromCollection = ownershipRecordFromCollection(entries);
  const ownedKeys = new Set(Object.keys(fromCollection));
  const next: Record<string, number> = { ...current };

  for (const [key, quantity] of Object.entries(current)) {
    if (quantity > 0 && !ownedKeys.has(key)) {
      next[key] = 0;
    }
  }

  return mergeOwnershipRecords(next, fromCollection);
}
