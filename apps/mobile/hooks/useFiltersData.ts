import { useQuery, type QueryClient } from '@tanstack/react-query';
import { prefetchFilterIcons } from '@/lib/prefetchFilterIcons';
import { catalogQueryKeys } from '@/src/api/queryKeys';
import { api } from '@/src/api/client';

const FILTERS_STALE_MS = 5 * 60_000;
const FILTERS_GC_MS = 30 * 60_000;

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

async function fetchCatalogFilters() {
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
