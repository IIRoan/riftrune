import type { FilterSnapshot, PaLogicalCard } from '@riftbound/contracts';
import type { RiftruneClient } from '../upstream/riftrune-client.js';

export type ExpandedCatalogProbe = {
  catalogPrintTotal: number;
  logicalCardCount: number;
  setPrintTotals: Record<string, number>;
};

export function countCollectiblePrintings(card: PaLogicalCard): number {
  return card.variants.filter((variant) => variant.isCollectible).length;
}

export function accumulatePrintCounts(
  card: PaLogicalCard,
  setPrintTotals: Map<string, number>
): number {
  let added = 0;
  for (const variant of card.variants) {
    if (!variant.isCollectible) continue;
    added += 1;
    const code = variant.set.prefix;
    setPrintTotals.set(code, (setPrintTotals.get(code) ?? 0) + 1);
  }
  return added;
}

/**
 * Walk the upstream catalog and count every collectible printing (Standard, Alt Art,
 * Overnumbered, Foil, etc.) — matching Piltover Archive collection totals (1,396).
 */
export async function probeExpandedCatalog(
  riftrune: RiftruneClient
): Promise<ExpandedCatalogProbe> {
  const seenCardIds = new Set<string>();
  const setPrintTotals = new Map<string, number>();
  let catalogPrintTotal = 0;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await riftrune.listCards({ limit: 100, page });
    let newCards = 0;

    for (const item of res.data) {
      const logical = await riftrune.getCard(item.variantNumber);
      if (seenCardIds.has(logical.id)) continue;
      seenCardIds.add(logical.id);
      newCards += 1;
      catalogPrintTotal += accumulatePrintCounts(logical, setPrintTotals);
    }

    hasMore = res.pagination.hasNext && newCards > 0;
    page += 1;
  }

  return {
    catalogPrintTotal,
    logicalCardCount: seenCardIds.size,
    setPrintTotals: Object.fromEntries(setPrintTotals),
  };
}

export function enrichFilterSnapshotWithPrintCounts(
  snapshot: FilterSnapshot,
  setPrintTotals: Record<string, number>
): FilterSnapshot {
  return {
    ...snapshot,
    sets: snapshot.sets.map((set) => ({
      ...set,
      printCount: setPrintTotals[set.code ?? set.id] ?? set.count,
    })),
  };
}

export function snapshotHasPrintCounts(snapshot: FilterSnapshot): boolean {
  return snapshot.sets.some((set) => (set.printCount ?? 0) > 0);
}
