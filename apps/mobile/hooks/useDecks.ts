import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from '@/components/ui/toast';
import type { DeckState } from '@/lib/deck-types';
import { setDeckDetailCache } from '@/lib/deck-state';
import {
  createDeck,
  deleteDeck,
  importDeckToAccount,
  listDecks,
  saveDeckToAccount,
  scheduleRemoteDeckSave,
} from '@/services/deckService';
import { isRemoteDeckReadOnlyError } from '@/services/remoteDeckService';

export const deckQueryKeys = {
  all: ['decks'] as const,
  list: (source: 'owned' | 'imported', q?: string) =>
    ['decks', 'list', source, q ?? ''] as const,
  detail: (id: string) => ['decks', id] as const,
};

export function useOwnedDecks(query?: string) {
  return useQuery({
    queryKey: deckQueryKeys.list('owned', query),
    queryFn: () => listDecks({ source: 'owned', q: query }),
    staleTime: 5_000,
  });
}

export function useImportedDecks(query?: string) {
  return useQuery({
    queryKey: deckQueryKeys.list('imported', query),
    queryFn: () => listDecks({ source: 'imported', q: query }),
    staleTime: 5_000,
  });
}

/** @deprecated Prefer useOwnedDecks / useImportedDecks */
export function useDecks() {
  return useQuery({
    queryKey: deckQueryKeys.all,
    queryFn: () => listDecks(),
    staleTime: 5_000,
  });
}

export function useDeckMutations() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['decks'] });
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
    onError: (error) => {
      if (isRemoteDeckReadOnlyError(error)) {
        toast.error('Imported Piltover Archive decks cannot be deleted.');
        return;
      }
      toast.error('Could not delete deck.');
    },
    onSuccess: invalidate,
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
