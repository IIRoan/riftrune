import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from '@/components/ui/toast';
import type { DeckBrowseFilters, DeckBrowseSort } from '@/constants/deckBrowse';
import { deckBrowseFiltersToQuery } from '@/constants/deckBrowse';
import type { DeckState } from '@/lib/deck-types';
import { applyDeckStateIfNewerToCache, setDeckDetailCache } from '@/lib/deck-state';
import {
  createDeck,
  deleteDeck,
  importDeckToAccount,
  listDecks,
  listDecksPage,
  saveDeckToAccount,
  scheduleRemoteDeckSave,
} from '@/services/deckService';
import { isRemoteDeckReadOnlyError } from '@/services/remoteDeckService';

import { deckQueryKeys } from '@/src/api/queryKeys';

const DECK_LIST_STALE_MS = 60_000;

function seedDeckDetailCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  decks: DeckState[]
): void {
  for (const deck of decks) {
    applyDeckStateIfNewerToCache(queryClient, deck.id, deck);
  }
}

export function useOwnedDecks(query?: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: deckQueryKeys.list('owned', query),
    queryFn: async () => {
      const decks = await listDecks({ source: 'owned', q: query });
      seedDeckDetailCaches(queryClient, decks);
      return decks;
    },
    staleTime: DECK_LIST_STALE_MS,
    placeholderData: (previous) => previous,
  });
}

export function useImportedDecks(query?: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: deckQueryKeys.list('imported', query),
    queryFn: async () => {
      const decks = await listDecks({ source: 'imported', q: query });
      seedDeckDetailCaches(queryClient, decks);
      return decks;
    },
    staleTime: DECK_LIST_STALE_MS,
    placeholderData: (previous) => previous,
  });
}

export function useImportedDecksBrowse(options: {
  q?: string;
  sort: DeckBrowseSort;
  filters: DeckBrowseFilters;
}) {
  const filterQuery = deckBrowseFiltersToQuery(options.filters);

  return useInfiniteQuery({
    queryKey: deckQueryKeys.browse(options),
    queryFn: ({ pageParam }) =>
      listDecksPage({
        source: 'imported',
        preview: true,
        q: options.q,
        page: pageParam,
        limit: 25,
        sort: options.sort.sort,
        dir: options.sort.dir,
        ...filterQuery,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext ? lastPage.pagination.page + 1 : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: DECK_LIST_STALE_MS,
  });
}

export function useDeckMutations() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: deckQueryKeys.all });
  }, [queryClient]);

  const saveDeck = useMutation({
    mutationFn: async (deck: DeckState) => {
      setDeckDetailCache(queryClient, deck);
      scheduleRemoteDeckSave(deck);
      return deck;
    },
    onSuccess: invalidate,
  });

  const saveDeckNow = useMutation({
    mutationFn: (deck: DeckState) => saveDeckToAccount(deck),
    onSuccess: (saved) => {
      setDeckDetailCache(queryClient, saved);
      invalidate();
    },
  });

  const removeDeck = useMutation({
    mutationFn: (id: string) => deleteDeck(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: deckQueryKeys.all });
      const previousLists = queryClient.getQueriesData<DeckState[]>({
        queryKey: ['decks', 'list'],
      });
      queryClient.setQueriesData<DeckState[]>({ queryKey: ['decks', 'list'] }, (current) =>
        current?.filter((deck) => deck.id !== id)
      );
      queryClient.removeQueries({ queryKey: deckQueryKeys.detail(id) });
      return { previousLists };
    },
    onError: (error, _id, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (isRemoteDeckReadOnlyError(error)) {
        toast.error('Imported Piltover Archive decks cannot be deleted.');
        return;
      }
      toast.error('Could not delete deck.');
    },
    onSettled: invalidate,
  });

  const importDeck = useMutation({
    mutationFn: (sourceDeckId: string) => importDeckToAccount(sourceDeckId),
    onSuccess: (saved) => {
      setDeckDetailCache(queryClient, saved);
      invalidate();
      toast.success('Deck imported to your collection.');
    },
    onError: () => {
      toast.error('Could not import deck.');
    },
  });

  const createNewDeck = useMutation({
    mutationFn: (input?: { name?: string; description?: string }) =>
      createDeck(input?.name, input?.description),
    onSuccess: invalidate,
  });

  return { saveDeck, saveDeckNow, removeDeck, importDeck, createNewDeck };
}
