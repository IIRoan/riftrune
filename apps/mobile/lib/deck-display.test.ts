import { describe, expect, it } from 'bun:test';
import { createEmptyDeck } from '@/lib/deck-card';
import { deckMainCompositionLines, deckSectionProgress } from '@/lib/deck-display';
import type { DeckCard } from '@/lib/deck-types';

function sampleCard(name: string, energy: number): DeckCard {
  return {
    cardId: name,
    variantNumber: `OGN-001`,
    name,
    type: 'Unit',
    super: null,
    tags: [],
    colors: ['Fury'],
    energy,
    setCode: 'OGN',
    rarity: 'Common',
    variantType: 'normal',
    isSignature: false,
  };
}

describe('deckSectionProgress', () => {
  it('counts champion toward main deck target', () => {
    const deck = createEmptyDeck();
    deck.champion = sampleCard('Champion', 3);
    const progress = deckSectionProgress(deck, 'mainDeck');
    expect(progress.current).toBe(1);
    expect(progress.target).toBe(40);
    expect(progress.hint).toBe('Includes chosen champion');
  });
});

describe('deckMainCompositionLines', () => {
  it('sorts by energy then name and caps visible lines', () => {
    const deck = createEmptyDeck();
    deck.mainDeck.set('B', { card: sampleCard('B', 2), count: 2 });
    deck.mainDeck.set('A', { card: sampleCard('A', 1), count: 3 });
    deck.mainDeck.set('C', { card: sampleCard('C', 2), count: 1 });

    const { lines, hiddenCount } = deckMainCompositionLines(deck, 2);
    expect(lines.map((line) => line.name)).toEqual(['A', 'B']);
    expect(hiddenCount).toBe(1);
  });
});
