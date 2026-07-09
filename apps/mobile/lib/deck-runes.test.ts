import { describe, expect, test } from 'bun:test';
import { createEmptyDeck, addCardToDeck } from '@/lib/deck-card';
import { DEFAULT_RUNE_SPLIT, seedDefaultRuneSplit } from '@/lib/deck-runes';
import type { DeckCard } from '@/lib/deck-types';

function mockRune(name: string, domain: string): DeckCard {
  return {
    cardId: `rune-${name}`,
    variantNumber: `OGN-R-${domain}`,
    name,
    type: 'Rune',
    super: null,
    tags: [],
    colors: [domain],
    energy: 0,
    setCode: 'OGN',
    rarity: 'Common',
    variantType: 'Standard',
    isSignature: false,
  };
}

describe('seedDefaultRuneSplit', () => {
  test('seeds 6/6 across two legend domains', () => {
    const legend: DeckCard = {
      cardId: 'legend-1',
      variantNumber: 'OGN-251',
      name: 'Jinx - Loose Cannon',
      type: 'Legend',
      super: null,
      tags: ['Jinx'],
      colors: ['Fury', 'Chaos'],
      energy: 0,
      setCode: 'OGN',
      rarity: 'Rare',
      variantType: 'Standard',
      isSignature: false,
    };

    let deck = createEmptyDeck();
    deck = addCardToDeck(deck, legend, { section: 'legend' });

    const runeCards = new Map([
      ['Fury', mockRune('Fury Rune', 'Fury')],
      ['Chaos', mockRune('Chaos Rune', 'Chaos')],
    ]);

    const seeded = seedDefaultRuneSplit(deck, runeCards);
    expect(seeded.runes.get('Fury Rune')?.count).toBe(DEFAULT_RUNE_SPLIT);
    expect(seeded.runes.get('Chaos Rune')?.count).toBe(DEFAULT_RUNE_SPLIT);
  });

  test('does not re-seed when runes already exist', () => {
    const legend: DeckCard = {
      cardId: 'legend-1',
      variantNumber: 'OGN-251',
      name: 'Jinx - Loose Cannon',
      type: 'Legend',
      super: null,
      tags: ['Jinx'],
      colors: ['Fury', 'Chaos'],
      energy: 0,
      setCode: 'OGN',
      rarity: 'Rare',
      variantType: 'Standard',
      isSignature: false,
    };

    const furyRune = mockRune('Fury Rune', 'Fury');
    let deck = createEmptyDeck();
    deck = addCardToDeck(deck, legend, { section: 'legend' });
    deck = addCardToDeck(deck, furyRune, { section: 'runes', count: 3 });

    const runeCards = new Map([
      ['Fury', furyRune],
      ['Chaos', mockRune('Chaos Rune', 'Chaos')],
    ]);

    const seeded = seedDefaultRuneSplit(deck, runeCards);
    expect(seeded.runes.get('Fury Rune')?.count).toBe(3);
    expect(seeded.runes.get('Chaos Rune')).toBeUndefined();
  });
});
