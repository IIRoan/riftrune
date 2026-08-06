import type { DeckState } from '@/lib/deck-types';

export function filterDecksByQuery(decks: DeckState[], query: string): DeckState[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return decks;

  return decks.filter((deck) => {
    const haystack = [
      deck.name,
      deck.description,
      deck.legend?.name ?? '',
      deck.champion?.name ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}
