import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { getCatalogIndexItems, useCatalogIndex } from '@/hooks/useCatalogIndex';
import {
  MIN_SEARCH_LENGTH,
  addSearchHistoryItem,
  cacheSearchResults,
  getCachedSearchResults,
} from '@/services/searchHistoryService';
import {
  getInMemoryCatalogIndex,
  mergeCatalogIndexItems,
} from '@/services/catalogIndexService';
import { api } from '@/src/api/client';
import { cardQueryKeys, catalogQueryKeys } from '@/src/api/queryKeys';
import { prefetchCardDetail } from '@/lib/prefetchCardDetail';
import { CATALOG_NETWORK_PAGE_SIZE } from '@/lib/catalog-page-size';
import {
  normalizeCardListItems,
  normalizeCardsListResponse,
  groupCardListItems,
} from '@/utils/variants';
import { searchCatalogItems } from '@/utils/catalogSearch';
import {
  catalogFiltersToQuery,
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
} from '@/constants/catalogFilters';

import type { CardsListQuery, CardsListResponse } from '@riftbound/contracts';
import { DEFAULT_CATALOG_SORT, type CatalogSort } from '@/constants/catalogSort';

const DEBOUNCE_MS = 250;
const LOCAL_DEBOUNCE_MS = 80;
const STALE_MS = 5 * 60 * 1000;

export function useCardSearch(
  query: string,
  sort: CatalogSort = DEFAULT_CATALOG_SORT,
  pageSize = 40,
  filters: CatalogFilters = DEFAULT_CATALOG_FILTERS
) {
  const trimmed = query.trim();
  const debounced = useDebounce(trimmed, DEBOUNCE_MS);
  const localDebounced = useDebounce(trimmed, LOCAL_DEBOUNCE_MS);
  const [immediateTerm, setImmediateTerm] = useState<string | null>(null);
  const activeTerm = immediateTerm ?? debounced;
  const localActiveTerm = immediateTerm ?? localDebounced;
  const queryClient = useQueryClient();
  const catalogIndex = useCatalogIndex();
  const catalogItems = getCatalogIndexItems(catalogIndex.data);
  const indexReady = catalogItems.length > 0;
  const [localPage, setLocalPage] = useState(1);
  const [instantCache, setInstantCache] = useState<{
    term: string;
    response: CardsListResponse;
  } | null>(null);
  const localHitCountRef = useRef(0);

  const enabled = activeTerm.length >= MIN_SEARCH_LENGTH;
  const inputMatchesActive = trimmed === activeTerm;
  const instantCacheForTerm =
    instantCache?.term === activeTerm ? instantCache.response : null;

  const localAllResults = useMemo(() => {
    if (!indexReady || localActiveTerm.length < MIN_SEARCH_LENGTH) return null;
    return searchCatalogItems(catalogItems, localActiveTerm, sort);
  }, [indexReady, catalogItems, localActiveTerm, sort]);

  localHitCountRef.current = localAllResults?.length ?? 0;

  const localVisibleCount = localPage * pageSize;
  const localResults = useMemo(() => {
    if (!localAllResults) return null;
    return localAllResults.slice(0, localVisibleCount);
  }, [localAllResults, localVisibleCount]);

  useEffect(() => {
    setLocalPage(1);
  }, [activeTerm, sort.sortBy, sort.dir, filters]);

  useEffect(() => {
    if (immediateTerm && debounced === immediateTerm) {
      setImmediateTerm(null);
    }
  }, [debounced, immediateTerm]);

  useEffect(() => {
    if (!enabled) {
      setInstantCache(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const cached = await getCachedSearchResults(activeTerm);
      if (!cancelled) {
        setInstantCache(
          cached ? { term: activeTerm, response: cached } : null
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTerm, enabled]);

  // Always query the API so upstream reconciliation can fill catalog gaps.
  // Local index is only an instant preview until network results arrive.
  const result = useInfiniteQuery({
    queryKey: cardQueryKeys.searchInfinite(
      activeTerm,
      sort.sortBy,
      sort.dir,
      filters
    ),
    queryFn: async ({ pageParam }) => {
      const params: Partial<CardsListQuery> = {
        q: activeTerm,
        limit: CATALOG_NETWORK_PAGE_SIZE,
        page: pageParam,
        sortBy: sort.sortBy,
        dir: sort.dir,
        // Empty local hits: force server past search caches so upstream is checked.
        ...(pageParam === 1 && localHitCountRef.current === 0 ? { refresh: true } : {}),
        ...catalogFiltersToQuery(filters),
      };
      const response = await api.listCards(params);
      const normalized = normalizeCardsListResponse(response);
      if (pageParam === 1) {
        await cacheSearchResults(activeTerm, normalized);
        await addSearchHistoryItem(activeTerm);
      }
      return normalized;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.meta.pagination;
      return pagination.hasNext ? pagination.page + 1 : undefined;
    },
    enabled,
    staleTime: STALE_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: () => {
      if (!instantCacheForTerm) return undefined;
      return {
        pages: [instantCacheForTerm],
        pageParams: [1],
      };
    },
    retry: 1,
  });

  const apiItems = useMemo(
    () => result.data?.pages.flatMap((page) => page.data) ?? [],
    [result.data]
  );

  const preferNetwork =
    enabled &&
    inputMatchesActive &&
    (apiItems.length > 0 || (result.isFetched && !result.isError));

  // Fold newly discovered cards into the local catalog index so later
  // offline/instant searches stay in sync with upstream-backed API results.
  useEffect(() => {
    if (!preferNetwork || apiItems.length === 0) return;

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
  }, [preferNetwork, apiItems, queryClient]);

  useEffect(() => {
    const cards =
      (preferNetwork ? apiItems : null) ?? localResults ?? instantCacheForTerm?.data ?? [];
    if (!cards.length) return;
    for (const card of cards.slice(0, 12)) {
      prefetchCardDetail(queryClient, card);
    }
  }, [preferNetwork, apiItems, localResults, instantCacheForTerm, queryClient]);

  const searchNow = useCallback(
    (override?: string) => {
      const term = (override ?? trimmed).trim();
      if (term.length >= MIN_SEARCH_LENGTH) {
        setImmediateTerm(term);
      }
    },
    [trimmed]
  );

  const awaitingNetworkResults =
    enabled &&
    inputMatchesActive &&
    result.isFetching &&
    !preferNetwork &&
    (localResults === null || localResults.length === 0) &&
    instantCacheForTerm === null;

  const rawItems = preferNetwork
    ? apiItems
    : awaitingNetworkResults
      ? []
      : (localResults ?? instantCacheForTerm?.data ?? apiItems);

  const items = useMemo(
    () => groupCardListItems(normalizeCardListItems(rawItems)),
    [rawItems]
  );

  const hasInstantResults =
    (localResults !== null && localResults.length > 0) || instantCacheForTerm !== null;
  const totalLocal = localAllResults?.length ?? 0;
  const localHasMore =
    !preferNetwork && indexReady && localResults !== null && items.length < totalLocal;
  const apiHasMore = preferNetwork && (result.hasNextPage ?? false);

  const fetchNextPage = useCallback(() => {
    if (preferNetwork) {
      if (result.hasNextPage && !result.isFetchingNextPage) {
        void result.fetchNextPage();
      }
      return;
    }
    if (localHasMore) {
      setLocalPage((page) => page + 1);
    }
  }, [
    preferNetwork,
    localHasMore,
    result.hasNextPage,
    result.isFetchingNextPage,
    result.fetchNextPage,
  ]);

  const lastPage = result.data?.pages.at(-1);
  const firstPage = result.data?.pages[0];

  return {
    debouncedQuery: activeTerm,
    minLength: MIN_SEARCH_LENGTH,
    debounceMs: indexReady ? LOCAL_DEBOUNCE_MS : DEBOUNCE_MS,
    items,
    meta:
      awaitingNetworkResults && !localResults
        ? undefined
        : preferNetwork
          ? (lastPage?.meta ?? firstPage?.meta ?? instantCacheForTerm?.meta)
          : (instantCacheForTerm?.meta ?? lastPage?.meta ?? firstPage?.meta),
    isLoading:
      enabled &&
      !hasInstantResults &&
      (awaitingNetworkResults ||
        (result.isPending && apiItems.length === 0 && !instantCacheForTerm)),
    isFetching:
      enabled &&
      awaitingNetworkResults &&
      result.isFetching &&
      apiItems.length === 0,
    isFetchingNextPage: preferNetwork ? result.isFetchingNextPage : false,
    hasNextPage: localHasMore || apiHasMore,
    fetchNextPage,
    isError: preferNetwork ? false : result.isError && !hasInstantResults,
    error: result.error,
    refetch: result.refetch,
    searchNow,
    isLocalSearch: !preferNetwork && indexReady && Boolean(localResults),
    isReconciling: enabled && result.isFetching && hasInstantResults,
  };
}
