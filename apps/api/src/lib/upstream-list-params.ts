import type { CardsListQuery } from '@riftbound/contracts';

export type UpstreamReconcileMode = 'sync' | 'background' | 'skip';

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
  if (query.colors) params.colors = query.colors;
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
    rarities: query.rarities ?? '',
    limit: query.limit,
    page: query.page,
    sortBy: query.sortBy,
    dir: query.dir,
  });
}

export function resolveUpstreamReconcileMode(
  query: CardsListQuery,
  localResult: { items: unknown[]; total: number },
  alreadyChecked: boolean
): UpstreamReconcileMode {
  if (alreadyChecked && !query.refresh) return 'skip';

  const q = query.q?.trim();
  const hasSearchQuery = Boolean(q && q.length >= 2);
  const localEmpty = localResult.total === 0 || localResult.items.length === 0;

  if (query.refresh || localEmpty) return 'sync';
  if (query.page > 1 && localResult.items.length === 0) return 'sync';

  if (hasSearchQuery && query.page === 1) {
    return 'background';
  }

  return 'skip';
}
