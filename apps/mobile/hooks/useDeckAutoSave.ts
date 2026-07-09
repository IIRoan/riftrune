import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DeckState } from '@/lib/deck-types';
import { deckQueryKeys } from '@/hooks/useDecks';
import { flushRemoteDeckSave, scheduleRemoteDeckSave } from '@/services/deckService';

/** Debounced account save while editing a deck. */
export function useDeckAutoSave(deck: DeckState | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!deck?.id || deck.readOnly) return;
    const latest =
      queryClient.getQueryData<DeckState | null>(deckQueryKeys.detail(deck.id)) ?? deck;
    if (latest.readOnly) return;
    scheduleRemoteDeckSave(latest);
  }, [deck, queryClient]);

  useEffect(() => {
    if (!deck?.id || deck.readOnly) return;
    const deckId = deck.id;
    return () => {
      void flushRemoteDeckSave(deckId);
    };
  }, [deck?.id, deck?.readOnly]);
}

export { DECK_AUTO_SAVE_MS } from '@/services/deckService';
