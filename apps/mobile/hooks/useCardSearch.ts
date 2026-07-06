import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CardsListResponse } from '@riftbound/contracts';
import { useDebounce } from '@/hooks/useDebounce';
import {
  MIN_SEARCH_LENGTH,
  addSearchHistoryItem,
  cacheSearchResults,
  getCachedSearchResults,
} from '@/services/searchHistoryService';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';
import { prefetchCardDetail } from '@/lib/prefetchCardDetail';
import { normalizeCardListItems, normalizeCardsListResponse, groupCardListItems } from '@/utils/variants';

import type { CardsListQuery } from '@riftbound/contracts';
import { DEFAULT_CATALOG_SORT, type CatalogSort } from '@/constants/catalogSort';

const DEBOUNCE_MS = 400;
const STALE_MS = 5 * 60 * 1000;

export function useCardSearch(query: string, sort: CatalogSort = DEFAULT_CATALOG_SORT) {
  const trimmed = query.trim();
  const debounced = useDebounce(trimmed, DEBOUNCE_MS);
  const [immediateTerm, setImmediateTerm] = useState<string | null>(null);
  const activeTerm = immediateTerm ?? debounced;
  const queryClient = useQueryClient();
  const [instantCache, setInstantCache] = useState<{
    term: string;
    response: CardsListResponse;
  } | null>(null);

  const enabled = activeTerm.length >= MIN_SEARCH_LENGTH;
  const inputMatchesActive = trimmed === activeTerm;
  const instantCacheForTerm =
    instantCache?.term === activeTerm ? instantCache.response : null;

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
    if (!result.data?.data.length) return;
    for (const card of result.data.data.slice(0, 12)) {
      prefetchCardDetail(queryClient, card);
    }
  }, [result.data, queryClient]);

  const searchNow = useCallback(
    (override?: string) => {
      const term = (override ?? trimmed).trim();
      if (term.length >= MIN_SEARCH_LENGTH) {
        setImmediateTerm(term);
      }
    },
    [trimmed]
  );

  const awaitingResults =
    !inputMatchesActive ||
    (result.isFetching && result.data === undefined && instantCacheForTerm === null);

  const rawItems = awaitingResults
    ? []
    : (result.data?.data ?? instantCacheForTerm?.data ?? []);
  const items = useMemo(
    () => groupCardListItems(normalizeCardListItems(rawItems)),
    [rawItems]
  );

  return {
    debouncedQuery: activeTerm,
    minLength: MIN_SEARCH_LENGTH,
    debounceMs: DEBOUNCE_MS,
    items,
    meta: awaitingResults ? undefined : (result.data?.meta ?? instantCacheForTerm?.meta),
    isLoading:
      enabled &&
      (awaitingResults || (result.isLoading && !result.data && !instantCacheForTerm)),
    isFetching: enabled && (awaitingResults || result.isFetching),
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
    searchNow,
  };
}
