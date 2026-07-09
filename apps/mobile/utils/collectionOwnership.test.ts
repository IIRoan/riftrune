import { describe, expect, test } from 'bun:test';
import type { CardListItem } from '@riftbound/contracts';
import type { CollectionEntry } from '@/services/collectionService';
import {
  collectVariantNumbers,
  mergeOwnershipRecords,
  ownershipMapFromRecord,
  ownershipRecordFromCollection,
} from '@/utils/collectionOwnership';

const sampleCard = {
  variantNumber: 'OGN-001',
  printings: [{ variantNumber: 'OGN-001' }, { variantNumber: 'OGN-001a' }],
} as CardListItem;

const sampleEntries: CollectionEntry[] = [
  {
    variantNumber: 'OGN-001',
    name: 'Vi',
    imageUrl: 'https://example.com/vi.jpg',
    setCode: 'OGN',
    rarity: 'Rare',
    type: 'Unit',
    variantLabel: 'Standard',
    isFoil: false,
    quantity: 2,
    addedAt: 1,
    updatedAt: 1,
  },
  {
    variantNumber: 'OGN-002',
    name: 'Jinx',
    imageUrl: 'https://example.com/jinx.jpg',
    setCode: 'OGN',
    rarity: 'Rare',
    type: 'Unit',
    variantLabel: 'Standard',
    isFoil: false,
    quantity: 0,
    addedAt: 1,
    updatedAt: 1,
  },
];

describe('collectionOwnership', () => {
  test('collectVariantNumbers gathers printings and extras', () => {
    expect(collectVariantNumbers([sampleCard], ['OGN-002'])).toEqual([
      'OGN-001',
      'OGN-001a',
      'OGN-002',
    ]);
  });

  test('collectVariantNumbers deduplicates extras', () => {
    expect(collectVariantNumbers([sampleCard], ['OGN-001', 'OGN-001'])).toEqual([
      'OGN-001',
      'OGN-001a',
    ]);
  });

  test('ownershipRecordFromCollection skips zero quantities', () => {
    expect(ownershipRecordFromCollection(sampleEntries)).toEqual({ 'OGN-001': 2 });
  });

  test('ownershipMapFromRecord omits zero quantities', () => {
    const map = ownershipMapFromRecord({ 'OGN-001': 2, 'OGN-002': 0 });
    expect(map.get('OGN-001')?.quantity).toBe(2);
    expect(map.has('OGN-002')).toBe(false);
  });

  test('mergeOwnershipRecords updates and removes quantities', () => {
    expect(
      mergeOwnershipRecords({ 'OGN-001': 1, 'OGN-002': 2 }, { 'OGN-001': 3, 'OGN-002': 0 })
    ).toEqual({ 'OGN-001': 3 });
  });

  test('mergeOwnershipRecords adds new variants', () => {
    expect(mergeOwnershipRecords({ 'OGN-001': 1 }, { 'OGN-003': 4 })).toEqual({
      'OGN-001': 1,
      'OGN-003': 4,
    });
  });
});
