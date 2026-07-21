import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { CATALOG_NETWORK_PAGE_SIZE } from '@/lib/catalog-page-size';
import { api } from '@/src/api/client';
import { cardQueryKeys, catalogQueryKeys } from '@/src/api/queryKeys';
import { getCatalogIndexItems, useCatalogIndex } from '@/hooks/useCatalogIndex';
import { mergeCatalogIndexItems } from '@/services/catalogIndexService';
import {
  cardOwnedQuantity,
  catalogFiltersToQuery,
  DEFAULT_CATALOG_FILTERS,
  matchesCatalogFilters,
  type CatalogFilters,
} from '@/constants/catalogFilters';
import {
  groupCardListItems,
  normalizeCardListItems,
  normalizeCardsListResponse,
} from '@/utils/variants';
import { featuredCatalogItems } from '@/utils/catalogSearch';

const STALE_MS = 10 * 60 * 1000;

export function useCatalogBrowseInfinite(
  pageSize: number,
  filters: CatalogFilters = DEFAULT_CATALOG_FILTERS,
  collectionByVariant: ReadonlyMap<string, { quantity: number }> = new Map()
) {
  const queryClient = useQueryClient();
  const catalogIndex = useCatalogIndex();
  const catalogItems = getCatalogIndexItems(catalogIndex.data);
  const indexReady = catalogItems.length > 0;
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const allBrowseItems = useMemo(() => {
    if (!indexReady) return null;

    const sourceItems =
      filters.collection === 'owned'
        ? catalogItems.filter((card) => cardOwnedQuantity(card, collectionByVariant) > 0)
        : featuredCatalogItems(catalogItems, catalogItems.length);

    const filtered = sourceItems.filter((card) =>
      matchesCatalogFilters(card, filters, collectionByVariant)
    );

    if (filters.collection === 'owned') {
      return [...filtered].sort((left, right) => left.name.localeCompare(right.name));
    }

    return filtered;
  }, [indexReady, catalogItems, filters, collectionByVariant]);

  useEffect(() => {
    setVisibleCount((count) => Math.max(count, pageSize));
  }, [pageSize]);

  useEffect(() => {
    if (!indexReady) return;
    setVisibleCount(pageSize);
  }, [indexReady, pageSize, filters]);

  // Always query the API so upstream reconciliation can fill catalog gaps.
  // Local index is an instant preview until network results arrive.
  const listQuery = useInfiniteQuery({
    queryKey: cardQueryKeys.browse(filters),
    queryFn: async ({ pageParam }) => {
      const response = await api.listCards({
        limit: CATALOG_NETWORK_PAGE_SIZE,
        page: pageParam,
        sortBy: 'name',
        dir: 'asc',
        ...(pageParam === 1 ? { refresh: true } : {}),
        ...catalogFiltersToQuery(filters),
      });
      const normalized = normalizeCardsListResponse(response);
      const items = groupCardListItems(normalizeCardListItems(normalized.data));
      const filtered = items.filter((card) =>
        matchesCatalogFilters(card, filters, collectionByVariant)
      );
      return {
        ...normalized,
        data: featuredCatalogItems(filtered, filtered.length),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.meta.pagination;
      return pagination.hasNext ? pagination.page + 1 : undefined;
    },
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

  const preferNetwork =
    apiItems.length > 0 || (listQuery.isFetched && !listQuery.isError);

  useEffect(() => {
    if (!preferNetwork || apiItems.length === 0) return;

    let cancelled = false;
    void (async () => {
      const added = await mergeCatalogIndexItems(apiItems);
      if (cancelled || added === 0) return;
      const current = queryClient.getQueryData<{
        catalogHash: string;
        pricesCatalogHash: string;
        cachedAt: number;
        items: typeof apiItems;
      }>(catalogQueryKeys.index);
      if (!current) return;
      queryClient.setQueryData(catalogQueryKeys.index, {
        ...current,
        items: [
          ...current.items,
          ...apiItems.filter(
            (card) =>
              !current.items.some(
                (existing) =>
                  existing.variantNumber.toLowerCase() ===
                  card.variantNumber.toLowerCase()
              )
          ),
        ],
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [preferNetwork, apiItems, queryClient]);

  const localItems = useMemo(
    () => allBrowseItems?.slice(0, visibleCount) ?? [],
    [allBrowseItems, visibleCount]
  );

  const items = preferNetwork ? apiItems : localItems;
  const totalLocal = allBrowseItems?.length ?? 0;
  const hasNextPage = preferNetwork
    ? (listQuery.hasNextPage ?? false)
    : localItems.length < totalLocal;

  const fetchNextPage = useCallback(() => {
    if (preferNetwork) {
      if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
        void listQuery.fetchNextPage();
      }
      return;
    }
    if (localItems.length < totalLocal) {
      setVisibleCount((count) => Math.min(totalLocal, count + pageSize));
    }
  }, [
    preferNetwork,
    localItems.length,
    totalLocal,
    pageSize,
    listQuery.hasNextPage,
    listQuery.isFetchingNextPage,
    listQuery.fetchNextPage,
  ]);

  return {
    items,
    isLoading:
      !preferNetwork &&
      listQuery.isPending &&
      localItems.length === 0 &&
      apiItems.length === 0,
    isFetching:
      !preferNetwork &&
      listQuery.isFetching &&
      localItems.length === 0 &&
      apiItems.length === 0,
    isFetchingNextPage: preferNetwork ? listQuery.isFetchingNextPage : false,
    hasNextPage,
    fetchNextPage,
    refetch: listQuery.refetch,
  };
}
