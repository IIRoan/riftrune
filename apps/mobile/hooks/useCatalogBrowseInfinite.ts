import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { CATALOG_NETWORK_PAGE_SIZE } from '@/lib/catalog-page-size';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';
import { getCatalogIndexItems, useCatalogIndex } from '@/hooks/useCatalogIndex';
import {
  groupCatalogListItems,
  normalizeCardListItems,
  normalizeCardsListResponse,
} from '@/utils/variants';
import { featuredCatalogItems } from '@/utils/catalogSearch';

const STALE_MS = 10 * 60 * 1000;

export function useCatalogBrowseInfinite(pageSize: number) {
  const catalogIndex = useCatalogIndex();
  const catalogItems = getCatalogIndexItems(catalogIndex.data);
  const indexReady = catalogItems.length > 0;
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const allFeatured = useMemo(() => {
    if (!indexReady) return null;
    return featuredCatalogItems(catalogItems, catalogItems.length);
  }, [indexReady, catalogItems]);

  useEffect(() => {
    setVisibleCount((count) => Math.max(count, pageSize));
  }, [pageSize]);

  useEffect(() => {
    if (!indexReady) return;
    setVisibleCount(pageSize);
  }, [indexReady, pageSize]);

  const listQuery = useInfiniteQuery({
    queryKey: cardQueryKeys.browse(),
    queryFn: async ({ pageParam }) => {
      const response = await api.listCards({
        limit: CATALOG_NETWORK_PAGE_SIZE,
        page: pageParam,
        sortBy: 'name',
        dir: 'asc',
      });
      const normalized = normalizeCardsListResponse(response);
      const items = groupCatalogListItems(normalizeCardListItems(normalized.data));
      return {
        ...normalized,
        data: featuredCatalogItems(items, items.length),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.meta.pagination;
      return pagination.hasNext ? pagination.page + 1 : undefined;
    },
    enabled: !indexReady,
    staleTime: STALE_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const apiItems = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [listQuery.data]
  );

  const localItems = useMemo(
    () => allFeatured?.slice(0, visibleCount) ?? [],
    [allFeatured, visibleCount]
  );

  const items = indexReady ? localItems : apiItems;
  const totalLocal = allFeatured?.length ?? 0;
  const hasNextPage = indexReady
    ? localItems.length < totalLocal
    : (listQuery.hasNextPage ?? false);

  const fetchNextPage = useCallback(() => {
    if (indexReady) {
      if (localItems.length < totalLocal) {
        setVisibleCount((count) => Math.min(totalLocal, count + pageSize));
      }
      return;
    }
    if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
      void listQuery.fetchNextPage();
    }
  }, [
    indexReady,
    localItems.length,
    totalLocal,
    pageSize,
    listQuery.hasNextPage,
    listQuery.isFetchingNextPage,
    listQuery.fetchNextPage,
  ]);

  return {
    items,
    isLoading: !indexReady && listQuery.isPending && apiItems.length === 0,
    isFetching: !indexReady && listQuery.isFetching && apiItems.length === 0,
    isFetchingNextPage: indexReady ? false : listQuery.isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: listQuery.refetch,
  };
}
