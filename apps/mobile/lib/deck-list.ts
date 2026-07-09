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

export function partitionDecks(decks: DeckState[]): {
  owned: DeckState[];
  imported: DeckState[];
} {
  const owned: DeckState[] = [];
  const imported: DeckState[] = [];

  for (const deck of decks) {
    if (deck.source === 'imported' || deck.readOnly) {
      imported.push(deck);
    } else {
      owned.push(deck);
    }
  }

  return { owned, imported };
}
