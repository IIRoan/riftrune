import type { QueryClient } from '@tanstack/react-query';
import type { DeckSectionKey, DeckState } from '@/lib/deck-types';
import {
  DECK_ADD_CATALOG_STALE_MS,
  deckAddInfiniteQueryKey,
  fetchDeckAddListPage,
} from '@/lib/deck-add-catalog';

/** Warm the deck-add catalog before navigating to the add screen. */
export function prefetchDeckAddCatalog(
  queryClient: QueryClient,
  deck: DeckState,
  section: DeckSectionKey,
  userQuery = ''
): Promise<void> {
  return queryClient.prefetchInfiniteQuery({
    queryKey: deckAddInfiniteQueryKey(section, deck, userQuery),
    queryFn: ({ pageParam }) => fetchDeckAddListPage(section, deck, userQuery, pageParam),
    initialPageParam: 1,
    staleTime: DECK_ADD_CATALOG_STALE_MS,
  });
}
