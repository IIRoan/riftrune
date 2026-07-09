import { describe, expect, test } from 'bun:test';
import { resolveDeckCardImageUrl } from '@/lib/deck-card';
import type { DeckCard } from '@/lib/deck-types';

function mockDeckCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    cardId: 'card-id',
    variantNumber: 'OGS-011',
    name: 'Flash',
    type: 'Spell',
    super: null,
    tags: [],
    colors: ['Calm'],
    energy: 2,
    setCode: 'OGS',
    rarity: 'Common',
    variantType: 'Standard',
    isSignature: false,
    ...overrides,
  };
}

describe('resolveDeckCardImageUrl', () => {
  test('uses the raw Piltover Archive CDN image while the local image cache is empty', () => {
    const cdnUrl = 'https://cdn.piltoverarchive.com/cards/ogs-011.webp';
    const uri = resolveDeckCardImageUrl(mockDeckCard({ imageUrl: cdnUrl }), new Map());

    expect(uri).toBe(cdnUrl);
  });

  test('prefers the cached local/API image once it is available', () => {
    const cdnUrl = 'https://cdn.piltoverarchive.com/cards/ogs-011.webp';
    const cached = new Map([['OGS-011', '/api/v1/images/cards/ogs-011.webp']]);
    const uri = resolveDeckCardImageUrl(mockDeckCard({ imageUrl: cdnUrl }), cached);

    expect(uri).toBe('http://localhost:7000/api/v1/images/cards/ogs-011.webp');
  });
});
