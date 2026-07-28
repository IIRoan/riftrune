import { describe, expect, test } from 'bun:test';
import { addCardToDeck, createEmptyDeck } from '@/lib/deck-card';
import { isCardEligibleForSection } from '@/lib/deck-eligibility';
import {
  BATTLEFIELD_MAX,
  battlefieldsAtCapacity,
  canAddBattlefield,
} from '@/lib/deck-limits';
import type { DeckCard } from '@/lib/deck-types';

function mockCard(overrides: Partial<DeckCard> & Pick<DeckCard, 'name'>): DeckCard {
  return {
    cardId: `id-${overrides.name}`,
    variantNumber: `OGN-${overrides.name}`,
    type: 'Battlefield',
    super: null,
    tags: [],
    colors: ['Fury'],
    energy: 0,
    setCode: 'OGN',
    rarity: 'Common',
    variantType: 'Standard',
    isSignature: false,
    ...overrides,
  };
}

describe('deck-limits', () => {
  test('blocks a fourth battlefield', () => {
    let deck = createEmptyDeck();
    const fields = ['Field A', 'Field B', 'Field C', 'Field D'].map((name) =>
      mockCard({ name, type: 'Battlefield' })
    );

    for (const field of fields.slice(0, 3)) {
      deck = addCardToDeck(deck, field, { section: 'battlefields' });
    }

    expect(battlefieldsAtCapacity(deck)).toBe(true);
    expect(canAddBattlefield(deck, fields[3]!.name)).toBe(false);

    const before = deck.battlefields.size;
    deck = addCardToDeck(deck, fields[3]!, { section: 'battlefields' });
    expect(deck.battlefields.size).toBe(before);
    expect(deck.battlefields.size).toBe(BATTLEFIELD_MAX);
  });

  test('Pre-Rift allows duplicate battlefield names within 3 slots', () => {
    let deck = createEmptyDeck();
    deck.format = 'pre-rift';
    const field = mockCard({ name: 'Field A', type: 'Battlefield' });

    deck = addCardToDeck(deck, field, { section: 'battlefields' });
    deck = addCardToDeck(deck, field, { section: 'battlefields' });
    deck = addCardToDeck(deck, field, { section: 'battlefields' });

    expect(deck.battlefields.get('Field A')?.count).toBe(3);
    expect(canAddBattlefield(deck, 'Field A')).toBe(false);
    expect(battlefieldsAtCapacity(deck)).toBe(true);
  });

  test('eligibility rejects a fourth unique battlefield', () => {
    let deck = createEmptyDeck();
    const fields = ['Field A', 'Field B', 'Field C', 'Field D'].map((name) =>
      mockCard({ name, type: 'Battlefield' })
    );

    for (const field of fields.slice(0, 3)) {
      deck = addCardToDeck(deck, field, { section: 'battlefields' });
    }

    const result = isCardEligibleForSection({
      deck,
      section: 'battlefields',
      candidateCard: fields[3]!,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('3 battlefields');
  });
});
