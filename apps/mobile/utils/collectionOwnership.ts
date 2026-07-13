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

export function mergeOwnershipRecords(
  base: Readonly<Record<string, number>>,
  patch: Readonly<Record<string, number>>
): Record<string, number> {
  const next = { ...base };
  for (const [variantNumber, quantity] of Object.entries(patch)) {
    if (quantity <= 0) {
      delete next[variantNumber];
    } else {
      next[variantNumber] = quantity;
    }
  }
  return next;
}
