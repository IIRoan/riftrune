import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient } from '@tanstack/react-query';
import type { CardListItem } from '@riftbound/contracts';
import { cardQueryKeys } from '@/src/api/queryKeys';

const batchCards = mock(async (variantNumbers: string[]) => ({
  data: [
    {
      id: 'card-1',
      name: 'Test Card',
      banEffectiveDate: null,
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
  meta: { found: variantNumbers.length, notFound: [] as string[], source: 'cache' as const },
}));

const getCard = mock(async () => {
  throw new Error('getCard should not be used for catalog prefetch');
});

mock.module('expo-image', () => ({
  Image: { prefetch: mock(async () => false) },
}));

mock.module('@/src/api/client', () => ({
  api: { batchCards, getCard },
}));

mock.module('@/lib/imageSessionCache', () => ({
  markSessionImageLoaded: mock(() => undefined),
}));

mock.module('@/utils/resolveImageUrl', () => ({
  resolveImageUrl: (url: string | null | undefined) => url ?? null,
}));

const {
  flushCardDetailPrefetch,
  prefetchCardDetail,
  resetCardDetailPrefetchQueue,
} = await import('@/lib/prefetchCardDetail');

function listItem(variantNumber: string): CardListItem {
  return {
    id: variantNumber,
    name: variantNumber,
    variantNumber,
    variantLabel: 'Standard',
    variantType: 'Standard',
    imageUrl: null,
    setCode: 'OGN',
    rarity: 'Common',
    type: 'Unit',
    domains: [],
    energyCost: 1,
    might: 1,
    power: null,
    superTypes: [],
    tags: [],
    banEffectiveDate: null,
    prices: [],
    printings: [],
  };
}

beforeEach(() => {
  batchCards.mockClear();
  getCard.mockClear();
  resetCardDetailPrefetchQueue();
});

describe('prefetchCardDetail', () => {
  test('coalesces many list rows into one batch POST', async () => {
    const queryClient = new QueryClient();

    prefetchCardDetail(queryClient, listItem('OGN-001'));
    prefetchCardDetail(queryClient, listItem('OGN-002'));
    prefetchCardDetail(queryClient, listItem('OGN-001'));

    await flushCardDetailPrefetch();

    expect(batchCards).toHaveBeenCalledTimes(1);
    expect(batchCards.mock.calls[0]?.[0]).toEqual(['OGN-001', 'OGN-002']);
    expect(getCard).not.toHaveBeenCalled();

    expect(queryClient.getQueryData(cardQueryKeys.detail('OGN-001'))).toMatchObject({
      data: { name: 'Test Card' },
      meta: { contentHash: 'batch-prefetch' },
    });
    expect(queryClient.getQueryData(cardQueryKeys.detail('OGN-001a'))).toMatchObject({
      data: { name: 'Test Card' },
    });
    expect(queryClient.getQueryData(cardQueryKeys.detail('OGN-002'))).toMatchObject({
      data: { name: 'Other' },
    });
  });

  test('skips variants that already have fresh cache data', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(cardQueryKeys.detail('OGN-001'), {
      data: { id: 'cached', name: 'Cached', banEffectiveDate: null, variants: [] },
      meta: { source: 'cache', contentHash: 'x' },
    });

    prefetchCardDetail(queryClient, listItem('OGN-001'));
    await flushCardDetailPrefetch();

    expect(batchCards).not.toHaveBeenCalled();
  });
});
