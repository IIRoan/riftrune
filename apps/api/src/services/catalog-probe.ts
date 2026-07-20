import type { FilterSnapshot, PaLogicalCard } from '@riftbound/contracts';
import type { RiftruneClient } from '../upstream/riftrune-client.js';
import { isFoilVariant } from './card-mapper.js';

export type ExpandedCatalogProbe = {
  catalogPrintTotal: number;
  logicalCardCount: number;
  setPrintTotals: Record<string, number>;
  setFoilPrintTotals: Record<string, number>;
};

export function isProbeVariantFoil(variant: {
  foilMode?: string;
  variantNumber?: string;
  variantLabel?: string;
  variantType?: string;
}): boolean {
  if (
    isFoilVariant(
      variant.variantNumber ?? '',
      variant.variantLabel,
      variant.variantType
    )
  ) {
    return true;
  }
  return (variant.foilMode ?? '').toLowerCase() === 'foil_only';
}

export function accumulatePrintCounts(
  card: PaLogicalCard,
  setPrintTotals: Map<string, number>,
  setFoilPrintTotals?: Map<string, number>
): number {
  let added = 0;
  for (const variant of card.variants) {
    if (!variant.isCollectible) continue;
    added += 1;
    const code = variant.set.prefix;
    setPrintTotals.set(code, (setPrintTotals.get(code) ?? 0) + 1);
    if (setFoilPrintTotals && isProbeVariantFoil(variant)) {
      setFoilPrintTotals.set(code, (setFoilPrintTotals.get(code) ?? 0) + 1);
    }
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
  const setFoilPrintTotals = new Map<string, number>();
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
      catalogPrintTotal += accumulatePrintCounts(
        logical,
        setPrintTotals,
        setFoilPrintTotals
      );
    }

    hasMore = res.pagination.hasNext && newCards > 0;
    page += 1;
  }

  return {
    catalogPrintTotal,
    logicalCardCount: seenCardIds.size,
    setPrintTotals: Object.fromEntries(setPrintTotals),
    setFoilPrintTotals: Object.fromEntries(setFoilPrintTotals),
  };
}

export function enrichFilterSnapshotWithPrintCounts(
  snapshot: FilterSnapshot,
  setPrintTotals: Record<string, number>,
  setFoilPrintTotals: Record<string, number> = {}
): FilterSnapshot {
  return {
    ...snapshot,
    sets: snapshot.sets.map((set) => {
      const key = set.code ?? set.id;
      const printCount = setPrintTotals[key] ?? set.count;
      const foilPrintCount = setFoilPrintTotals[key] ?? set.foilPrintCount ?? 0;
      return {
        ...set,
        printCount,
        foilPrintCount,
      };
    }),
  };
}

export function snapshotHasPrintCounts(snapshot: FilterSnapshot): boolean {
  return snapshot.sets.some((set) => (set.printCount ?? 0) > 0);
}
