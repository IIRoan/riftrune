import { describe, expect, test } from 'bun:test';
import { createEmptyDeck } from '@/lib/deck-card';
import {
  deckCardsMatch,
  deckMembershipRevision,
  findDeckEntryForCandidate,
  getDeckCandidateCount,
  isDeckCandidateInSection,
  listDeckSectionCards,
} from '@/lib/deck-membership';
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

describe('deck-membership', () => {
  test('matches cards by cardId when names differ slightly', () => {
    const a = mockCard({
      name: 'Obelisk of Power',
      cardId: 'bf-1',
      variantNumber: 'OGN-001',
    });
    const b = mockCard({
      name: 'Obelisk of Power ',
      cardId: 'bf-1',
      variantNumber: 'OGN-001',
    });
    expect(deckCardsMatch(a, b)).toBe(true);
  });

  test('tracks battlefield membership and removal', () => {
    const battlefield = mockCard({ name: 'Zaun Warrens', type: 'Battlefield' });
    let deck = createEmptyDeck();
    deck.battlefields.set(battlefield.name, { card: battlefield, count: 1 });
    deck = { ...deck, updatedAt: 100 };

    expect(isDeckCandidateInSection(deck, 'battlefields', battlefield)).toBe(true);
    expect(getDeckCandidateCount(deck, 'battlefields', battlefield)).toBe(1);

    deck.battlefields.delete(battlefield.name);
    deck = { ...deck, updatedAt: 200 };

    expect(isDeckCandidateInSection(deck, 'battlefields', battlefield)).toBe(false);
    expect(findDeckEntryForCandidate(deck, 'battlefields', battlefield)).toBeNull();
  });

  test('tracks main deck counts', () => {
    const unit = mockCard({ name: 'Flame Chompers', type: 'Unit' });
    const deck = createEmptyDeck();
    deck.mainDeck.set(unit.name, { card: unit, count: 2 });

    expect(getDeckCandidateCount(deck, 'mainDeck', unit)).toBe(2);
    expect(isDeckCandidateInSection(deck, 'mainDeck', unit)).toBe(true);

    deck.mainDeck.delete(unit.name);
    expect(getDeckCandidateCount(deck, 'mainDeck', unit)).toBe(0);
  });

  test('lists section cards sorted by energy then name', () => {
    const low = mockCard({ name: 'Zed', type: 'Unit', energy: 1 });
    const mid = mockCard({ name: 'Annie', type: 'Unit', energy: 2 });
    const high = mockCard({ name: 'Aatrox', type: 'Unit', energy: 2 });
    const deck = createEmptyDeck();
    deck.mainDeck.set(mid.name, { card: mid, count: 1 });
    deck.mainDeck.set(low.name, { card: low, count: 3 });
    deck.mainDeck.set(high.name, { card: high, count: 2 });

    expect(listDeckSectionCards(deck, 'mainDeck').map((c) => c.name)).toEqual([
      'Zed',
      'Aatrox',
      'Annie',
    ]);
    expect(listDeckSectionCards(deck, 'sideboard')).toEqual([]);
  });

  test('revision changes when membership changes', () => {
    const battlefield = mockCard({ name: 'Zaun Warrens', type: 'Battlefield' });
    let deck = createEmptyDeck();
    const emptyRevision = deckMembershipRevision(deck);

    deck.battlefields.set(battlefield.name, { card: battlefield, count: 1 });
    deck = { ...deck, updatedAt: deck.updatedAt + 1 };
    const withBfRevision = deckMembershipRevision(deck);

    deck.battlefields.delete(battlefield.name);
    deck = { ...deck, updatedAt: deck.updatedAt + 1 };
    const removedRevision = deckMembershipRevision(deck);

    expect(withBfRevision).not.toBe(emptyRevision);
    expect(removedRevision).not.toBe(withBfRevision);
    expect(isDeckCandidateInSection(deck, 'battlefields', battlefield)).toBe(false);
  });
});
