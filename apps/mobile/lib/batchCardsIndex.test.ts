import { beforeEach, describe, expect, mock, test } from 'bun:test';

const batchCards = mock(async (variantNumbers: string[]) => ({
  data: [
    {
      id: 'card-1',
      name: 'Test Card',
      banEffectiveDate: '2024-01-01T00:00:00.000Z',
      variants: [
        {
          variantNumber: 'OGN-001',
          variantLabel: 'Standard',
          variantType: 'Standard',
          imageUrl: null,
          prices: [],
        },
        {
          variantNumber: 'OGN-001a',
          variantLabel: 'Alt',
          variantType: 'Alternate Art',
          imageUrl: null,
          prices: [],
        },
      ],
    },
    {
      id: 'card-2',
      name: 'Other',
      banEffectiveDate: null,
      variants: [
        {
          variantNumber: 'OGN-002',
          variantLabel: 'Standard',
          variantType: 'Standard',
          imageUrl: null,
          prices: [],
        },
      ],
    },
  ].filter((card) =>
    card.variants.some((variant) => variantNumbers.includes(variant.variantNumber))
  ),
}));

mock.module('@/src/api/client', () => ({
  api: { batchCards },
}));

const { fetchCardDetailsByVariant } = await import('@/lib/batchCardsIndex');

beforeEach(() => {
  batchCards.mockClear();
});

describe('fetchCardDetailsByVariant', () => {
  test('chunks variant numbers and indexes by variant', async () => {
    const map = await fetchCardDetailsByVariant(['OGN-002', 'OGN-001', 'OGN-001a']);

    expect(batchCards).toHaveBeenCalledTimes(1);
    expect(batchCards.mock.calls[0]?.[0]).toEqual(['OGN-002', 'OGN-001', 'OGN-001a']);
    expect(map.get('OGN-001')?.name).toBe('Test Card');
    expect(map.get('OGN-001a')?.name).toBe('Test Card');
    expect(map.get('OGN-002')?.banEffectiveDate).toBeNull();
  });

  test('returns an empty map without calling the API', async () => {
    const map = await fetchCardDetailsByVariant([]);
    expect(map.size).toBe(0);
    expect(batchCards).not.toHaveBeenCalled();
  });
});
