import { describe, expect, it } from 'bun:test';
import type { CollectionEntry } from '@/services/collectionService';
import {
  catalogCardTotalFromTypes,
  computeRarityBreakdown,
  computeTypeBreakdown,
  countUniqueCardNames,
  countUniqueVariants,
  sumCollectionCopies,
} from './collectionStats';

function entry(
  overrides: Partial<CollectionEntry> & Pick<CollectionEntry, 'variantNumber' | 'name'>
): CollectionEntry {
  return {
    imageUrl: '',
    setCode: 'OGN',
    rarity: 'Common',
    variantLabel: 'Standard',
    isFoil: false,
    quantity: 1,
    addedAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('collectionStats', () => {
  it('counts copies, unique names, and unique variants separately', () => {
    const collection = [
      entry({ variantNumber: 'OGN-001', name: 'Card A', quantity: 4 }),
      entry({
        variantNumber: 'OGN-001',
        name: 'Card A',
        quantity: 2,
        condition: 'near_mint',
      }),
      entry({ variantNumber: 'OGN-002', name: 'Card B', quantity: 3 }),
    ];

    expect(sumCollectionCopies(collection)).toBe(9);
    expect(countUniqueCardNames(collection)).toBe(2);
    expect(countUniqueVariants(collection)).toBe(2);
  });

  it('breaks down types and rarities by unique card names', () => {
    const collection = [
      entry({
        variantNumber: 'OGN-001',
        name: 'Unit A',
        type: 'Unit',
        rarity: 'Common',
        quantity: 5,
      }),
      entry({
        variantNumber: 'OGN-001a',
        name: 'Unit A',
        type: 'Unit',
        rarity: 'Common',
        quantity: 1,
      }),
      entry({
        variantNumber: 'OGN-002',
        name: 'Spell B',
        type: 'Spell',
        rarity: 'Rare',
        quantity: 2,
      }),
    ];

    expect(
      computeTypeBreakdown(collection, [
        { name: 'Unit', count: 10 },
        { name: 'Spell', count: 5 },
      ])
    ).toEqual([
      { name: 'Unit', owned: 1, total: 10 },
      { name: 'Spell', owned: 1, total: 5 },
    ]);

    expect(
      computeRarityBreakdown(collection, [
        { name: 'Common', count: 8 },
        { name: 'Rare', count: 4 },
      ])
    ).toEqual([
      { name: 'Common', owned: 1, total: 8 },
      { name: 'Rare', owned: 1, total: 4 },
    ]);
  });

  it('derives catalog card total from filter types', () => {
    expect(
      catalogCardTotalFromTypes([
        { name: 'Unit', count: 501 },
        { name: 'Spell', count: 192 },
        { name: 'Card', count: 99 },
      ])
    ).toBe(693);
  });
});
