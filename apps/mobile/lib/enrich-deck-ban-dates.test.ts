import { describe, expect, test } from 'bun:test';
import {
  mergeBanDatesIntoDeck,
  syncDeckLegalityFields,
} from '@/lib/enrich-deck-ban-dates';
import type { DeckCard, DeckState } from '@/lib/deck-types';

function deckCard(name: string, banEffectiveDate: string | null = null): DeckCard {
  return {
    cardId: 'card-1',
    variantNumber: 'OGN-001',
    name,
    type: 'Unit',
    super: null,
    tags: [],
    colors: [],
    energy: 1,
    setCode: 'OGN',
    rarity: 'Common',
    variantType: 'Standard',
    isSignature: false,
    banEffectiveDate,
  };
}

function emptyDeck(overrides: Partial<DeckState> = {}): DeckState {
  return {
    id: 'deck-1',
    name: 'Test',
    description: '',
    createdAt: 0,
    updatedAt: 0,
    legend: null,
    champion: null,
    mainDeck: new Map(),
    runes: new Map(),
    battlefields: new Map(),
    sideboard: new Map(),
    addToSideboard: false,
    ...overrides,
  };
}

describe('mergeBanDatesIntoDeck', () => {
  test('overwrites stale null ban dates from catalog', () => {
    const deck = emptyDeck({
      mainDeck: new Map([
        ['Banned', { card: deckCard('Banned', null), count: 1 }],
      ]),
    });
    const banByVariant = new Map([['OGN-001', '2020-01-01T00:00:00.000Z']]);
    const merged = mergeBanDatesIntoDeck(deck, banByVariant);
    const entry = merged.mainDeck.get('Banned');
    expect(entry?.card.banEffectiveDate).toBe('2020-01-01T00:00:00.000Z');
  });
});

describe('syncDeckLegalityFields', () => {
  test('marks owned decks illegal when banned cards are present', () => {
    const deck = emptyDeck({
      source: 'owned',
      mainDeck: new Map([
        [
          'Banned',
          { card: deckCard('Banned', '2020-01-01T00:00:00.000Z'), count: 1 },
        ],
      ]),
    });
    const synced = syncDeckLegalityFields(deck);
    expect(synced.isLegal).toBe(false);
    expect(synced.bannedCardNames).toEqual(['Banned']);
  });

  test('marks owned decks legal when no banned cards are present', () => {
    const deck = emptyDeck({ source: 'owned' });
    const synced = syncDeckLegalityFields(deck);
    expect(synced.isLegal).toBe(true);
    expect(synced.bannedCardNames).toBeUndefined();
  });
});
