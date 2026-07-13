import type { QueryClient } from '@tanstack/react-query';
import { api } from '@/src/api/client';
import type { CatalogIndexCacheKey } from '@/services/catalogIndexService';
import { getInMemoryCatalogIndex, readPersistedCatalogIndex } from '@/services/catalogIndexService';

export const CATALOG_META_QUERY_KEY = ['catalog', 'meta'] as const;

export type CatalogMeta = {
  cachedAt: string;
  catalogHash: string;
  pricesCatalogHash: string;
  variantCount: number;
};

const CATALOG_META_STALE_MS = 5 * 60_000;

export function getCachedCatalogMeta(
  queryClient: Pick<QueryClient, 'getQueryData'>
): CatalogMeta | undefined {
  return queryClient.getQueryData<CatalogMeta>(CATALOG_META_QUERY_KEY);
}

export async function fetchCatalogMeta(): Promise<CatalogMeta> {
  const res = await api.getFilters();
  return res.meta;
}

export function prefetchCatalogMeta(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: CATALOG_META_QUERY_KEY,
    queryFn: fetchCatalogMeta,
    staleTime: CATALOG_META_STALE_MS,
  });
}

export async function resolveCatalogIndexCacheKey(
  queryClient?: Pick<QueryClient, 'getQueryData' | 'setQueryData'>
): Promise<CatalogIndexCacheKey> {
  const cached = queryClient ? getCachedCatalogMeta(queryClient) : undefined;
  if (cached) {
    return {
      catalogHash: cached.catalogHash,
      pricesCatalogHash: cached.pricesCatalogHash,
    };
  }

  try {
    const meta = await fetchCatalogMeta();
    queryClient?.setQueryData(CATALOG_META_QUERY_KEY, meta);
    return {
      catalogHash: meta.catalogHash,
      pricesCatalogHash: meta.pricesCatalogHash,
    };
  } catch {
    const inMemory = getInMemoryCatalogIndex();
    if (inMemory) {
      return {
        catalogHash: inMemory.catalogHash,
        pricesCatalogHash: inMemory.pricesCatalogHash,
      };
    }

    const persisted = await readPersistedCatalogIndex();
    return {
      catalogHash: persisted?.catalogHash ?? '',
      pricesCatalogHash: persisted?.pricesCatalogHash ?? '',
    };
  }
}
