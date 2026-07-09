import { describe, expect, test } from 'bun:test';
import type { CardListItem } from '@riftbound/contracts';
import {
  getCollectedPrintingsForDetailCard,
  getCollectedPrintingsForListCard,
} from '@/utils/collectionRemove';

const listCard = {
  cardId: '00000000-0000-0000-0000-000000000001',
  variantNumber: 'OGN-001',
  name: 'Vi Destructive',
  type: 'Unit',
  energy: 2,
  might: 2,
  power: 2,
  rarity: 'Rare',
  setCode: 'OGN',
  colors: ['Body'],
  imageUrl: 'https://example.com/vi.jpg',
  cardmarketId: null,
  priceEur: null,
  printings: [
    {
      variantNumber: 'OGN-001',
      variantLabel: 'Standard',
      isFoil: false,
      priceEur: null,
    },
    {
      variantNumber: 'OGN-001*',
      variantLabel: 'Foil',
      isFoil: true,
      priceEur: null,
    },
  ],
  isBanned: false,
} satisfies CardListItem;

const ownership = new Map([
  ['OGN-001', { quantity: 1 }],
  ['OGN-001*', { quantity: 2 }],
]);

describe('collectionRemove helpers', () => {
  test('getCollectedPrintingsForListCard returns only owned printings', () => {
    const rows = getCollectedPrintingsForListCard(listCard, ownership);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.variantNumber).toBe('OGN-001');
    expect(rows[1]?.quantity).toBe(2);
  });

  test('getCollectedPrintingsForDetailCard scopes to search group', () => {
    const rows = getCollectedPrintingsForDetailCard(
      {
        variants: [
          {
            variantNumber: 'OGN-253',
            variantLabel: 'Standard',
            variantType: 'standard',
          },
          {
            variantNumber: 'OGN-253-Foil',
            variantLabel: 'Standard',
            variantType: 'foil',
          },
          {
            variantNumber: 'OGN-253-Release',
            variantLabel: 'Release Event Promo',
            variantType: 'promo',
          },
        ],
      },
      new Map([
        ['OGN-253', { quantity: 1 }],
        ['OGN-253-Foil', { quantity: 2 }],
        ['OGN-253-Release', { quantity: 3 }],
      ]),
      {
        variantNumber: 'OGN-253',
        variantLabel: 'Standard',
        variantType: 'standard',
      }
    );

    expect(rows.map((row) => row.variantNumber)).toEqual(['OGN-253', 'OGN-253-Foil']);
  });
});
