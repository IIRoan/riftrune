import type { CollectionEntry } from '@/services/collectionService';

export type CollectionBreakdownRow = {
  name: string;
  owned: number;
  total: number;
};

/** Sum of copy quantities across all collection rows. */
export function sumCollectionCopies(collection: CollectionEntry[]): number {
  return collection.reduce((sum, entry) => sum + entry.quantity, 0);
}

/** Unique logical cards (by name), matching Piltover Archive "Cards Collected". */
export function countUniqueCardNames(collection: CollectionEntry[]): number {
  const names = new Set<string>();
  for (const entry of collection) {
    if (entry.quantity > 0 && entry.name) {
      names.add(entry.name);
    }
  }
  return names.size;
}

/** Unique printings (by variant number) owned with quantity > 0. */
export function countUniqueVariants(collection: CollectionEntry[]): number {
  const variants = new Set<string>();
  for (const entry of collection) {
    if (entry.quantity > 0) {
      variants.add(entry.variantNumber);
    }
  }
  return variants.size;
}

/** Catalog size for completion: sum of logical card counts per type. */
export function catalogCardTotalFromTypes(
  types: { name: string; count: number }[]
): number {
  return types
    .filter((type) => type.name !== 'Card')
    .reduce((sum, type) => sum + type.count, 0);
}

export function computeTypeBreakdown(
  collection: CollectionEntry[],
  apiTypes: { name: string; count: number }[]
): CollectionBreakdownRow[] {
  const namesByType = new Map<string, Set<string>>();

  for (const entry of collection) {
    if (!entry.type || entry.quantity <= 0) continue;
    const names = namesByType.get(entry.type) ?? new Set<string>();
    names.add(entry.name);
    namesByType.set(entry.type, names);
  }

  return apiTypes
    .filter((type) => type.name !== 'Card')
    .map((type) => ({
      name: type.name,
      owned: namesByType.get(type.name)?.size ?? 0,
      total: type.count,
    }));
}

export function computeRarityBreakdown(
  collection: CollectionEntry[],
  apiRarities: { name: string; count: number }[]
): CollectionBreakdownRow[] {
  const namesByRarity = new Map<string, Set<string>>();

  for (const entry of collection) {
    if (entry.quantity <= 0) continue;
    const rarity = entry.rarity || 'Unknown';
    const names = namesByRarity.get(rarity) ?? new Set<string>();
    names.add(entry.name);
    namesByRarity.set(rarity, names);
  }

  return apiRarities.map((rarity) => ({
    name: rarity.name,
    owned: namesByRarity.get(rarity.name)?.size ?? 0,
    total: rarity.count,
  }));
}

export function countUniqueFoilVariants(collection: CollectionEntry[]): number {
  const foilVariants = new Set<string>();
  for (const entry of collection) {
    if (entry.quantity > 0 && entry.isFoil) {
      foilVariants.add(entry.variantNumber);
    }
  }
  return foilVariants.size;
}
