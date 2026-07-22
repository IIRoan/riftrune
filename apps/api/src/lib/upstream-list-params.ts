import type { CardsListQuery } from '@riftbound/contracts';

export type UpstreamReconcileMode = 'sync' | 'skip';

/** Hard cap so a broken upstream total cannot loop forever. */
export const UPSTREAM_BACKFILL_PAGE_CAP = 100;

/** Map our list query to riftrune.com external API params. */
export function buildUpstreamListParams(
  query: CardsListQuery
): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {
    page: query.page,
    limit: Math.min(query.limit, 100),
    sortBy: query.sortBy,
    dir: query.dir,
  };

  const q = query.q?.trim();
  if (q) params.q = q;
  if (query.types) params.types = query.types;
  if (query.super) params.supertypes = query.super;
  if (query.variants) params.variants = query.variants;
  if (query.sets) params.sets = query.sets;
  // PA has no colorMode=within. Passing colors uses PA's stricter "contains all"
  // match and under-backfills deck-builder identity pools — omit for within.
  if (query.colors && query.colorMode !== 'within') {
    params.colors = query.colors;
  }
  if (query.rarities) params.rarities = query.rarities;
  if (query.energyMin != null) params.energyMin = query.energyMin;
  if (query.energyMax != null) params.energyMax = query.energyMax;
  if (query.powerMin != null) params.powerMin = query.powerMin;
  if (query.powerMax != null) params.powerMax = query.powerMax;
  if (query.mightMin != null) params.mightMin = query.mightMin;
  if (query.mightMax != null) params.mightMax = query.mightMax;

  return params;
}

export function upstreamCheckKey(query: CardsListQuery): string {
  return JSON.stringify({
    q: query.q?.trim().toLowerCase() ?? '',
    types: query.types ?? '',
    super: query.super ?? '',
    variants: query.variants ?? '',
    sets: query.sets ?? '',
    colors: query.colors ?? '',
    colorMode: query.colorMode ?? 'all',
    rarities: query.rarities ?? '',
    limit: query.limit,
    page: query.page,
    sortBy: query.sortBy,
    dir: query.dir,
  });
}

/**
 * How many upstream pages to walk while local totals lag.
 * Text search still multi-pages when behind so alt arts on later pages are not missed.
 */
export function maxUpstreamBackfillPages(query: CardsListQuery): number {
  const q = query.q?.trim();
  if (q && q.length >= 2) return 20;
  return UPSTREAM_BACKFILL_PAGE_CAP;
}

export function resolveUpstreamReconcileMode(
  query: CardsListQuery,
  localResult: { items: unknown[]; total: number },
  alreadyChecked: boolean
): UpstreamReconcileMode {
  if (query.refresh) return 'sync';

  const q = query.q?.trim();
  const hasSearchQuery = Boolean(q && q.length >= 2);
  const localEmpty = localResult.total === 0 || localResult.items.length === 0;

  // Empty local results must always re-verify — never trust a prior miss.
  if (localEmpty) return 'sync';

  if (alreadyChecked) return 'skip';

  // Text search awaits upstream so we never return a stale hit set.
  if (hasSearchQuery) return 'sync';

  // First page of browse / deck-builder filters must also reconcile — otherwise
  // a partial catalog stays incomplete forever when local already has some hits.
  if (query.page === 1) return 'sync';

  return 'skip';
}
