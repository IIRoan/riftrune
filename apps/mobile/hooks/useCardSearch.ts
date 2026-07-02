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
import { normalizeCardListItems, normalizeCardsListResponse } from '@/utils/variants';

const DEBOUNCE_MS = 400;
const STALE_MS = 5 * 60 * 1000;

export function useCardSearch(query: string) {
  const trimmed = query.trim();
  const debounced = useDebounce(trimmed, DEBOUNCE_MS);
  const [immediateTerm, setImmediateTerm] = useState<string | null>(null);
  const activeTerm = immediateTerm ?? debounced;
  const queryClient = useQueryClient();
  const [instantCache, setInstantCache] = useState<CardsListResponse | null>(null);

  const enabled = activeTerm.length >= MIN_SEARCH_LENGTH;

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
      if (!cancelled) setInstantCache(cached);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTerm, enabled]);

  const result = useQuery({
    queryKey: cardQueryKeys.search(activeTerm),
    queryFn: async () => {
      const response = await api.listCards({ q: activeTerm, limit: 40, page: 1 });
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
    placeholderData: (previous) => {
      if (previous) return previous;
      if (instantCache) return instantCache;
      return queryClient.getQueryData<CardsListResponse>(
        cardQueryKeys.search(activeTerm)
      );
    },
    retry: 1,
  });

  useEffect(() => {
    if (!result.data?.data.length) return;
    for (const card of result.data.data.slice(0, 6)) {
      void queryClient.prefetchQuery({
        queryKey: cardQueryKeys.detail(card.variantNumber),
        queryFn: () => api.getCard(card.variantNumber),
        staleTime: STALE_MS,
      });
    }
  }, [result.data, queryClient]);

  const searchNow = useCallback(() => {
    if (trimmed.length >= MIN_SEARCH_LENGTH) {
      setImmediateTerm(trimmed);
    }
  }, [trimmed]);

  const rawItems = result.data?.data ?? instantCache?.data ?? [];
  const items = useMemo(() => normalizeCardListItems(rawItems), [rawItems]);

  return {
    debouncedQuery: activeTerm,
    minLength: MIN_SEARCH_LENGTH,
    debounceMs: DEBOUNCE_MS,
    items,
    meta: result.data?.meta ?? instantCache?.meta,
    isLoading: enabled && result.isLoading && !result.data && !instantCache,
    isFetching: enabled && result.isFetching,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
    searchNow,
  };
}
