import { describe, expect, test } from 'bun:test';
import { isCardEligibleForSection } from '@/lib/deck-eligibility';
import { createEmptyDeck } from '@/lib/deck-card';
import type { DeckCard } from '@/lib/deck-types';

function mockCard(overrides: Partial<DeckCard> & Pick<DeckCard, 'name'>): DeckCard {
  return {
    cardId: `id-${overrides.name}`,
    variantNumber: `OGN-${overrides.name}`,
    type: 'Unit',
    super: null,
    tags: [],
    colors: ['Fury'],
    energy: 2,
    setCode: 'OGN',
    rarity: 'Common',
    variantType: 'Standard',
    isSignature: false,
    ...overrides,
  };
}

describe('totalCopiesForCardName via eligibility', () => {
  test('main deck size does not block unrelated battlefields', () => {
    const deck = createEmptyDeck();
    for (let i = 0; i < 15; i += 1) {
      deck.mainDeck.set(`Card ${i}`, {
        card: mockCard({ name: `Card ${i}`, type: 'Unit' }),
        count: 3,
      });
    }

    const battlefield = mockCard({ name: 'Zaun Warrens', type: 'Battlefield' });
    const result = isCardEligibleForSection({
      deck,
      section: 'battlefields',
      candidateCard: battlefield,
    });

    expect(result.eligible).toBe(true);
  });

  test('still enforces per-name copy limit in main deck', () => {
    const deck = createEmptyDeck();
    const unit = mockCard({ name: 'Flame Chompers', type: 'Unit' });
    deck.mainDeck.set(unit.name, { card: unit, count: 3 });

    const result = isCardEligibleForSection({
      deck,
      section: 'mainDeck',
      candidateCard: unit,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('copy');
  });
});
