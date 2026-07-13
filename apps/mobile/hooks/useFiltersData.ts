import { useQuery, type QueryClient } from '@tanstack/react-query';
import { catalogQueryKeys } from '@/src/api/queryKeys';
import { api } from '@/src/api/client';

export { catalogQueryKeys };

const FILTERS_STALE_MS = 5 * 60_000;
const FILTERS_GC_MS = 30 * 60_000;

/** @deprecated Import catalogQueryKeys.filters from @/src/api/queryKeys */
export const FILTERS_QUERY_KEY = catalogQueryKeys.filters;
const FILTERS_GC_MS = 30 * 60_000;

export type CatalogFiltersSnapshot = Awaited<ReturnType<typeof fetchCatalogFilters>>;

export async function fetchCatalogFilters() {
  const res = await api.getFilters();
  return {
    ...res.data,
    variantCount: res.meta.variantCount,
  };
}

export function prefetchCatalogFilters(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: catalogQueryKeys.filters,
    queryFn: fetchCatalogFilters,
    staleTime: FILTERS_STALE_MS,
  });
}

export function useFiltersData() {
  return useQuery({
    queryKey: catalogQueryKeys.filters,
    queryFn: fetchCatalogFilters,
    staleTime: FILTERS_STALE_MS,
    gcTime: FILTERS_GC_MS,
  });
}
