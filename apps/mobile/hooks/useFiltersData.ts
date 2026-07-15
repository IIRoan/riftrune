import { useQuery, type QueryClient } from '@tanstack/react-query';
import { prefetchFilterIcons } from '@/lib/prefetchFilterIcons';
import { catalogQueryKeys } from '@/src/api/queryKeys';
import { api } from '@/src/api/client';

export { catalogQueryKeys };

const FILTERS_STALE_MS = 5 * 60_000;
const FILTERS_GC_MS = 30 * 60_000;

/** @deprecated Import catalogQueryKeys.filters from @/src/api/queryKeys */
export const FILTERS_QUERY_KEY = catalogQueryKeys.filters;

export type CatalogFiltersSnapshot = Awaited<ReturnType<typeof fetchCatalogFilters>>;

/** UI loading/error flags for filter panels — avoids treating background refetch as initial load. */
export function filtersQueryUiState<T>(query: {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
}): { isLoading: boolean; isError: boolean } {
  const hasData = query.data != null;
  return {
    isLoading: !hasData && query.isPending,
    isError: !hasData && query.isError,
  };
}

export async function fetchCatalogFilters() {
  const res = await api.getFilters();
  const snapshot = {
    ...res.data,
    variantCount: res.meta.variantCount,
  };
  prefetchFilterIcons(snapshot);
  return snapshot;
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
