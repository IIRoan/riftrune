import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { CATALOG_NETWORK_PAGE_SIZE } from '@/lib/catalog-page-size';
import { api } from '@/src/api/client';
import { cardQueryKeys, catalogQueryKeys } from '@/src/api/queryKeys';
import { getCatalogIndexItems, useCatalogIndex } from '@/hooks/useCatalogIndex';
import {
  getInMemoryCatalogIndex,
  mergeCatalogIndexItems,
} from '@/services/catalogIndexService';
import {
  cardOwnedQuantity,
  catalogFiltersToQuery,
  DEFAULT_CATALOG_FILTERS,
  matchesCatalogFilters,
  type CatalogFilters,
} from '@/constants/catalogFilters';
import { DEFAULT_CATALOG_SORT, type CatalogSort } from '@/constants/catalogSort';
import {
  groupCardListItems,
  normalizeCardListItems,
  normalizeCardsListResponse,
} from '@/utils/variants';
import { sortCatalogItems } from '@/utils/catalogSearch';

const STALE_MS = 10 * 60 * 1000;

export function useCatalogBrowseInfinite(
  pageSize: number,
  filters: CatalogFilters = DEFAULT_CATALOG_FILTERS,
  collectionByVariant: ReadonlyMap<string, { quantity: number }> = new Map(),
  sort: CatalogSort = DEFAULT_CATALOG_SORT
) {
  const queryClient = useQueryClient();
  const catalogIndex = useCatalogIndex();
  const catalogItems = getCatalogIndexItems(catalogIndex.data);
  const indexReady = catalogItems.length > 0;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const ownedOnly = filters.collection === 'owned';
  // Ownership map changes often while scrolling; only the owned filter needs it.
  const ownershipForFilter = ownedOnly ? collectionByVariant : EMPTY_OWNERSHIP;

  const allBrowseItems = useMemo(() => {
    if (!indexReady) return null;

    const sourceItems = ownedOnly
      ? catalogItems.filter((card) => cardOwnedQuantity(card, ownershipForFilter) > 0)
      : catalogItems;

    const filtered = sourceItems.filter((card) =>
      matchesCatalogFilters(card, filters, ownershipForFilter)
    );

    return sortCatalogItems(filtered, sort);
  }, [
    indexReady,
    catalogItems,
    filters,
    ownedOnly,
    ownershipForFilter,
    sort.sortBy,
    sort.dir,
  ]);

  useEffect(() => {
    setVisibleCount((count) => Math.max(count, pageSize));
  }, [pageSize]);

  useEffect(() => {
    if (!indexReady) return;
    // Reset to a fresh page of the new order — keep at least one viewport loaded.
    setVisibleCount(pageSize);
  }, [indexReady, pageSize, filters, sort.sortBy, sort.dir]);

  // Background reconciliation only. UI stays on the local index so sort/filter
  // switches stay synchronous; network pages warm prices without blocking paint.
  const listQuery = useInfiniteQuery({
    queryKey: cardQueryKeys.browse(filters, sort.sortBy, sort.dir),
    queryFn: async ({ pageParam }) => {
      const response = await api.listCards({
        limit: CATALOG_NETWORK_PAGE_SIZE,
        page: pageParam,
        sortBy: sort.sortBy,
        dir: sort.dir,
        ...catalogFiltersToQuery(filters),
      });
      const normalized = normalizeCardsListResponse(response);
      const items = groupCardListItems(normalizeCardListItems(normalized.data));
      return {
        ...normalized,
        data: items.filter((card) =>
          matchesCatalogFilters(card, filters, ownershipForFilter)
        ),
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

  useEffect(() => {
    if (apiItems.length === 0) return;

    let cancelled = false;
    void (async () => {
      const changed = await mergeCatalogIndexItems(apiItems);
      if (cancelled || changed === 0) return;
      const merged = getInMemoryCatalogIndex();
      if (!merged) return;
      queryClient.setQueryData(catalogQueryKeys.index, merged);
    })();

    return () => {
      cancelled = true;
    };
  }, [apiItems, queryClient]);

  const localItems = useMemo(
    () => allBrowseItems?.slice(0, visibleCount) ?? [],
    [allBrowseItems, visibleCount]
  );

  const items = indexReady
    ? localItems
    : sortCatalogItems(apiItems, sort).slice(0, Math.max(visibleCount, pageSize));

  const totalLocal = allBrowseItems?.length ?? 0;
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
    isLoading:
      !indexReady &&
      listQuery.isPending &&
      localItems.length === 0 &&
      apiItems.length === 0,
    isFetching:
      !indexReady &&
      listQuery.isFetching &&
      localItems.length === 0 &&
      apiItems.length === 0,
    isFetchingNextPage: indexReady ? false : listQuery.isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: async () => {
      await catalogIndex.refetch();
      return listQuery.refetch();
    },
  };
}

const EMPTY_OWNERSHIP: ReadonlyMap<string, { quantity: number }> = new Map();
