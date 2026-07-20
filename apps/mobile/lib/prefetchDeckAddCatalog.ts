import type { QueryClient } from '@tanstack/react-query';
import type { DeckSectionKey, DeckState } from '@/lib/deck-types';
import {
  DECK_ADD_CATALOG_STALE_MS,
  deckAddInfiniteQueryKey,
  defaultDeckAddCatalogFilters,
  fetchDeckAddListPage,
} from '@/lib/deck-add-catalog';

/** Warm the deck-add catalog before navigating to the add screen. */
export function prefetchDeckAddCatalog(
  queryClient: QueryClient,
  deck: DeckState,
  section: DeckSectionKey,
  userQuery = ''
): Promise<void> {
  const filters = defaultDeckAddCatalogFilters(section, deck);
  return queryClient.prefetchInfiniteQuery({
    queryKey: deckAddInfiniteQueryKey(section, deck, userQuery, filters),
    queryFn: ({ pageParam }) =>
      fetchDeckAddListPage(section, deck, userQuery, filters, pageParam),
    initialPageParam: 1,
    staleTime: DECK_ADD_CATALOG_STALE_MS,
  });
}
