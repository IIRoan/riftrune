import { describe, expect, test } from 'bun:test';
import {
  ALL_CARDS_FILTER,
  matchesCatalogFilter,
} from '@/utils/catalogFilter';

const sampleCard = {
  colors: ['Fury', 'Mind'],
  type: 'Unit',
  rarity: 'Rare',
  variantNumber: 'OGN-001',
  printings: [{ variantNumber: 'OGN-001' }, { variantNumber: 'OGN-001*' }],
};

describe('matchesCatalogFilter', () => {
  test('all cards passes every row', () => {
    expect(matchesCatalogFilter(sampleCard, ALL_CARDS_FILTER, new Map())).toBe(true);
  });

  test('domain filter matches color name', () => {
    expect(matchesCatalogFilter(sampleCard, 'Fury', new Map())).toBe(true);
    expect(matchesCatalogFilter(sampleCard, 'Calm', new Map())).toBe(false);
  });

  test('type and rarity filters use exact match', () => {
    expect(matchesCatalogFilter(sampleCard, 'Unit', new Map())).toBe(true);
    expect(matchesCatalogFilter(sampleCard, 'Spell', new Map())).toBe(false);
    expect(matchesCatalogFilter(sampleCard, 'Rare', new Map())).toBe(true);
    expect(matchesCatalogFilter(sampleCard, 'Common', new Map())).toBe(false);
  });

  test('owned filter sums quantities across printings', () => {
    const collection = new Map([
      ['OGN-001', { quantity: 0 }],
      ['OGN-001*', { quantity: 2 }],
    ]);
    expect(matchesCatalogFilter(sampleCard, 'Owned', collection)).toBe(true);
    expect(matchesCatalogFilter(sampleCard, 'Wishlist', collection)).toBe(false);
  });

  test('wishlist filter matches cards with zero owned copies', () => {
    const collection = new Map([['OGN-001', { quantity: 0 }]]);
    expect(matchesCatalogFilter(sampleCard, 'Wishlist', collection)).toBe(true);
    expect(matchesCatalogFilter(sampleCard, 'Owned', collection)).toBe(false);
  });

  test('owned filter treats missing printings as zero quantity', () => {
    expect(matchesCatalogFilter(sampleCard, 'Owned', new Map())).toBe(false);
    expect(matchesCatalogFilter(sampleCard, 'Wishlist', new Map())).toBe(true);
  });
});
