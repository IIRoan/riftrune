import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isCardBannedAt } from '@riftbound/contracts';
import { fetchBanDatesByVariant } from '@/lib/enrich-deck-ban-dates';
import { getDeckVariantNumbers } from '@/lib/deck-card';
import type { DeckState } from '@/lib/deck-types';
import { cardQueryKeys } from '@/src/api/queryKeys';
import {
  mergeBanDatesIntoDeck,
  syncDeckLegalityFields,
} from '@/lib/enrich-deck-ban-dates';

/** Shared catalog ban-date lookup keyed by variant set (reused across decks/screens). */
export function useBanDatesByVariant(variantNumbers: string[]) {
  const key = useMemo(
    () => [...new Set(variantNumbers.filter(Boolean))].sort().join('|'),
    [variantNumbers]
  );

  return useQuery({
    queryKey: cardQueryKeys.banDates(key),
    queryFn: () => fetchBanDatesByVariant(key.split('|').filter(Boolean)),
    enabled: key.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useDeckLiveLegality(deck: DeckState | null) {
  // Cached deck rows can be stale — overlay today's catalog ban dates while editing.
  const variantNumbers = useMemo(
    () => (deck ? getDeckVariantNumbers(deck) : []),
    [deck]
  );
  const banQuery = useBanDatesByVariant(variantNumbers);

  const liveDeck = useMemo(() => {
    if (!deck) return null;
    if (!banQuery.data) return deck;
    return syncDeckLegalityFields(mergeBanDatesIntoDeck(deck, banQuery.data));
  }, [banQuery.data, deck]);

  return {
    deck: liveDeck,
    isRefreshing: banQuery.isFetching,
    refetch: banQuery.refetch,
  };
}

/** Boolean ban map for collection tiles and lightweight checks. */
export function useCardBanByVariant(variantNumbers: string[]) {
  const banDatesQuery = useBanDatesByVariant(variantNumbers);

  const data = useMemo(() => {
    if (!banDatesQuery.data) return undefined;
    const banned = new Map<string, boolean>();
    for (const [variantNumber, banDate] of banDatesQuery.data) {
      banned.set(variantNumber, isCardBannedAt(banDate));
    }
    return banned;
  }, [banDatesQuery.data]);

  return {
    ...banDatesQuery,
    data,
  };
}
