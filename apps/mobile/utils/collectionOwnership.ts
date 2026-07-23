import type { CardListItem } from '@riftbound/contracts';
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
      record[entry.variantNumber] = entry.quantity;
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
  for (const [variantNumber, quantity] of Object.entries(record)) {
    if (quantity > 0) {
      map.set(variantNumber, { quantity });
    }
  }
  return map;
}

/**
 * Overlay collection-list ownership onto a quantities/ownership map.
 * Collection entries win — they are updated synchronously by optimistic mutations,
 * while ownership slices can lag behind in-flight `/quantities` responses.
 */
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

/**
 * Merge ownership patches into a cache record.
 * Zero quantities are retained as known-unowned so list tiles do not re-fetch
 * `/quantities` for every variant after a mutation invalidation/refetch.
 */
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

/**
 * Apply a full collection snapshot onto an ownership cache without wiping
 * known-zero entries for variants that were never owned.
 */
export function mergeOwnershipFromCollection(
  current: Readonly<Record<string, number>>,
  entries: readonly CollectionEntry[]
): Record<string, number> {
  const fromCollection = ownershipRecordFromCollection(entries);
  const ownedVariantNumbers = new Set(Object.keys(fromCollection));
  const next: Record<string, number> = { ...current };

  for (const [variantNumber, quantity] of Object.entries(current)) {
    if (quantity > 0 && !ownedVariantNumbers.has(variantNumber)) {
      next[variantNumber] = 0;
    }
  }

  return mergeOwnershipRecords(next, fromCollection);
}
