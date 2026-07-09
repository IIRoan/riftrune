import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';
import { getCatalogIndexItems, useCatalogIndex } from '@/hooks/useCatalogIndex';
import { groupCatalogListItems, normalizeCardListItems, normalizeCardsListResponse } from '@/utils/variants';
import { featuredCatalogItems } from '@/utils/catalogSearch';

export const FEATURED_CATALOG_SIZE = 12;

export function useFeaturedCatalog() {
  const catalogIndex = useCatalogIndex();
  const catalogItems = getCatalogIndexItems(catalogIndex.data);

  const localFeatured = useMemo(() => {
    if (catalogItems.length === 0) return null;
    return featuredCatalogItems(catalogItems, FEATURED_CATALOG_SIZE);
  }, [catalogItems]);

  const query = useQuery({
    queryKey: cardQueryKeys.featured(FEATURED_CATALOG_SIZE),
    queryFn: async () => {
      const response = await api.listCards({ limit: 100, page: 1, sortBy: 'name', dir: 'asc' });
      const normalized = normalizeCardsListResponse(response);
      const items = groupCatalogListItems(normalizeCardListItems(normalized.data));
      return featuredCatalogItems(items, FEATURED_CATALOG_SIZE);
    },
    enabled: !localFeatured,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
  });

  return {
    ...query,
    data: query.data ?? localFeatured ?? undefined,
    isLoading: localFeatured ? false : query.isLoading,
  };
}
