import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CardsListResponse } from '@riftbound/contracts';
import { useDebounce } from '@/hooks/useDebounce';
import { getCatalogIndexItems, useCatalogIndex } from '@/hooks/useCatalogIndex';
import {
  MIN_SEARCH_LENGTH,
  addSearchHistoryItem,
  cacheSearchResults,
  getCachedSearchResults,
} from '@/services/searchHistoryService';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';
import { prefetchCardDetail } from '@/lib/prefetchCardDetail';
import {
  normalizeCardListItems,
  normalizeCardsListResponse,
  groupCardListItems,
} from '@/utils/variants';
import { searchCatalogItems } from '@/utils/catalogSearch';

import type { CardsListQuery } from '@riftbound/contracts';
import { DEFAULT_CATALOG_SORT, type CatalogSort } from '@/constants/catalogSort';

const DEBOUNCE_MS = 250;
const LOCAL_DEBOUNCE_MS = 80;
const STALE_MS = 5 * 60 * 1000;

export function useCardSearch(query: string, sort: CatalogSort = DEFAULT_CATALOG_SORT) {
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
  const [instantCache, setInstantCache] = useState<{
    term: string;
    response: CardsListResponse;
  } | null>(null);

  const enabled = activeTerm.length >= MIN_SEARCH_LENGTH;
  const inputMatchesActive = trimmed === activeTerm;
  const instantCacheForTerm =
    instantCache?.term === activeTerm ? instantCache.response : null;

  const localResults = useMemo(() => {
    if (!indexReady || localActiveTerm.length < MIN_SEARCH_LENGTH) return null;
    return searchCatalogItems(catalogItems, localActiveTerm, sort, 40);
  }, [indexReady, catalogItems, localActiveTerm, sort]);

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

  const result = useQuery({
    queryKey: cardQueryKeys.search(activeTerm, 40, sort.sortBy, sort.dir),
    queryFn: async () => {
      const params: Partial<CardsListQuery> = {
        q: activeTerm,
        limit: 40,
        page: 1,
        sortBy: sort.sortBy,
        dir: sort.dir,
      };
      const response = await api.listCards(params);
      const normalized = normalizeCardsListResponse(response);
      await cacheSearchResults(activeTerm, normalized);
      await addSearchHistoryItem(activeTerm);
      return normalized;
    },
    enabled,
    staleTime: STALE_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: () =>
      instantCacheForTerm ??
      queryClient.getQueryData<CardsListResponse>(
        cardQueryKeys.search(activeTerm, 40, sort.sortBy, sort.dir)
      ),
    retry: 1,
  });

  useEffect(() => {
    const cards = result.data?.data ?? localResults ?? [];
    if (!cards.length) return;
    for (const card of cards.slice(0, 12)) {
      prefetchCardDetail(queryClient, card);
    }
  }, [result.data, localResults, queryClient]);

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
    !inputMatchesActive ||
    (result.isFetching && result.data === undefined && instantCacheForTerm === null);

  const rawItems =
    awaitingNetworkResults && !localResults
      ? []
      : (result.data?.data ?? localResults ?? instantCacheForTerm?.data ?? []);
  const items = useMemo(
    () => groupCardListItems(normalizeCardListItems(rawItems)),
    [rawItems]
  );

  const hasInstantResults = localResults !== null || instantCacheForTerm !== null;

  return {
    debouncedQuery: activeTerm,
    minLength: MIN_SEARCH_LENGTH,
    debounceMs: indexReady ? LOCAL_DEBOUNCE_MS : DEBOUNCE_MS,
    items,
    meta: awaitingNetworkResults && !localResults
      ? undefined
      : (result.data?.meta ?? instantCacheForTerm?.meta),
    isLoading:
      enabled &&
      !hasInstantResults &&
      (awaitingNetworkResults || (result.isLoading && !result.data && !instantCacheForTerm)),
    isFetching: enabled && awaitingNetworkResults && result.isFetching,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
    searchNow,
    isLocalSearch: indexReady && Boolean(localResults),
  };
}
