import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CardListItem } from '@riftbound/contracts';
import {
  fetchAndPersistCatalogIndex,
  getInMemoryCatalogIndex,
  readPersistedCatalogIndex,
} from '@/services/catalogIndexService';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';

export const catalogIndexQueryKey = ['catalog', 'index'] as const;

export function useCatalogIndex() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: catalogIndexQueryKey,
    queryFn: async () => {
      let catalogHash: string | null = null;
      try {
        const filters = await api.getFilters();
        catalogHash = filters.meta.catalogHash;
      } catch {
        catalogHash = getInMemoryCatalogIndex()?.catalogHash ?? null;
      }

      return fetchAndPersistCatalogIndex(catalogHash);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: () => {
      const inMemory = getInMemoryCatalogIndex();
      if (inMemory) return inMemory;
      return queryClient.getQueryData(catalogIndexQueryKey);
    },
    initialData: () => getInMemoryCatalogIndex() ?? undefined,
  });
}

export async function hydrateCatalogIndex(queryClient: ReturnType<typeof useQueryClient>) {
  const persisted = await readPersistedCatalogIndex();
  if (persisted) {
    queryClient.setQueryData(catalogIndexQueryKey, persisted);
  }
}

export async function prefetchCatalogIndex(queryClient: ReturnType<typeof useQueryClient>) {
  await hydrateCatalogIndex(queryClient);
  await queryClient.prefetchQuery({
    queryKey: catalogIndexQueryKey,
    queryFn: async () => {
      let catalogHash: string | null = getInMemoryCatalogIndex()?.catalogHash ?? null;
      if (!catalogHash) {
        try {
          const filters = await api.getFilters();
          catalogHash = filters.meta.catalogHash;
        } catch {
          catalogHash = null;
        }
      }
      return fetchAndPersistCatalogIndex(catalogHash);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function getCatalogIndexItems(
  index: { items: CardListItem[] } | null | undefined
): CardListItem[] {
  return index?.items ?? getInMemoryCatalogIndex()?.items ?? [];
}
