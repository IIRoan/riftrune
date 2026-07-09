import { getSectionCount } from '@/lib/deck-card';
import type { DeckEntry, DeckState } from '@/lib/deck-types';

export type DeckCompositionLine = {
  count: number;
  name: string;
  energy: number;
};

function sortedEntries(map: Map<string, DeckEntry>): DeckCompositionLine[] {
  return [...map.values()]
    .map((entry) => ({
      count: entry.count,
      name: entry.card.name,
      energy: entry.card.energy,
    }))
    .sort((a, b) => {
      if (a.energy !== b.energy) return a.energy - b.energy;
      return a.name.localeCompare(b.name);
    });
}

export function deckMainCompositionLines(
  deck: DeckState,
  maxLines = 5
): { lines: DeckCompositionLine[]; hiddenCount: number; totalCards: number } {
  const lines = sortedEntries(deck.mainDeck);
  const totalCards =
    getSectionCount(deck, 'mainDeck') +
    (deck.champion ? 1 : 0) +
    getSectionCount(deck, 'battlefields') +
    getSectionCount(deck, 'sideboard');

  if (lines.length <= maxLines) {
    return { lines, hiddenCount: 0, totalCards };
  }

  return {
    lines: lines.slice(0, maxLines),
    hiddenCount: lines.length - maxLines,
    totalCards,
  };
}

export function deckSectionProgress(
  deck: DeckState,
  section: 'mainDeck' | 'sideboard' | 'battlefields'
): { current: number; target: number; hint?: string } {
  if (section === 'mainDeck') {
    const current = getSectionCount(deck, 'mainDeck') + (deck.champion ? 1 : 0);
    return {
      current,
      target: 40,
      hint: deck.champion ? 'Includes chosen champion' : undefined,
    };
  }

  if (section === 'sideboard') {
    return {
      current: getSectionCount(deck, 'sideboard'),
      target: 8,
      hint: deck.addToSideboard ? 'Sideboard enabled' : undefined,
    };
  }

  return {
    current: getSectionCount(deck, 'battlefields'),
    target: 3,
  };
}
