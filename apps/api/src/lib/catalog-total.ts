import type { FilterSnapshot } from '@riftbound/contracts';

/** Sum upstream variant-type buckets (Standard, Alt Art, Overnumbered, etc.). */
export function sumVariantTypeCounts(snapshot: Pick<FilterSnapshot, 'variants'>): number {
  return (snapshot.variants ?? []).reduce((sum, entry) => sum + entry.count, 0);
}

/** Sum expanded per-set printing totals when probed from upstream. */
export function sumSetPrintCounts(snapshot: Pick<FilterSnapshot, 'sets'>): number {
  return (snapshot.sets ?? []).reduce(
    (sum, set) => sum + (set.printCount ?? set.count),
    0
  );
}

/**
 * Total collectible printings in the catalog.
 * Prefer expanded per-set print counts (matches Piltover Archive: 1,396).
 */
export function computeCatalogTotal(
  snapshot: Pick<FilterSnapshot, 'variants' | 'sets'>,
  syncedPrintTotal = 0
): number {
  const fromSetPrints = sumSetPrintCounts(snapshot);
  if (fromSetPrints > 0 && snapshot.sets.some((set) => set.printCount != null)) {
    return Math.max(fromSetPrints, syncedPrintTotal);
  }

  const fromVariantTypes = sumVariantTypeCounts(snapshot);
  if (fromVariantTypes > 0) {
    return Math.max(fromVariantTypes, syncedPrintTotal);
  }

  return Math.max(fromSetPrints, syncedPrintTotal);
}
