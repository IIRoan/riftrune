import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  createDeck,
  deleteDeck,
  loadDecks,
  upsertDeck,
} from '@/services/deckStorageService';
import type { DeckState } from '@/lib/deck-types';

export const deckQueryKeys = {
  all: ['decks'] as const,
  detail: (id: string) => ['decks', id] as const,
};

export function useDecks() {
  return useQuery({
    queryKey: deckQueryKeys.all,
    queryFn: loadDecks,
    staleTime: 5_000,
  });
}

export function useDeckMutations() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: deckQueryKeys.all });
  }, [queryClient]);

  const saveDeck = useMutation({
    mutationFn: (deck: DeckState) => upsertDeck(deck),
    onSuccess: invalidate,
  });

  const removeDeck = useMutation({
    mutationFn: (id: string) => deleteDeck(id),
    onSuccess: invalidate,
  });

  const createNewDeck = useMutation({
    mutationFn: (name?: string) => createDeck(name),
    onSuccess: invalidate,
  });

  return { saveDeck, removeDeck, createNewDeck };
}
