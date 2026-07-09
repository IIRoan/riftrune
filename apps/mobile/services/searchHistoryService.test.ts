import { beforeEach, describe, expect, test } from 'bun:test';
import type { CardsListResponse } from '@riftbound/contracts';
import { createMemoryAsyncStorage } from '../test/memory-async-storage';

const memoryStorage = createMemoryAsyncStorage();
memoryStorage.install();

const {
  addSearchHistoryItem,
  cacheSearchResults,
  clearSearchHistory,
  filterHistoryLocally,
  getCachedSearchResults,
  getSearchHistory,
  removeSearchHistoryItem,
} = await import('./searchHistoryService');

const sampleResponse = {
  data: [
    {
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
      ],
      isBanned: false,
    },
  ],
  meta: {
    pagination: {
      total: 1,
      page: 1,
      limit: 40,
      totalPages: 1,
      hasNext: false,
    },
    source: 'cache' as const,
    catalogHash: 'hash-v1',
  },
} satisfies CardsListResponse;

beforeEach(async () => {
  memoryStorage.clear();
  await clearSearchHistory();
});

describe('searchHistoryService', () => {
  test('addSearchHistoryItem deduplicates case-insensitively', async () => {
    await addSearchHistoryItem('Viktor');
    await addSearchHistoryItem('viktor');

    const history = await getSearchHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.query).toBe('viktor');
  });

  test('removeSearchHistoryItem removes one entry', async () => {
    await addSearchHistoryItem('Viktor');
    await addSearchHistoryItem('Jinx');
    await removeSearchHistoryItem('Viktor');

    const history = await getSearchHistory();
    expect(history.map((item) => item.query)).toEqual(['Jinx']);
  });

  test('cacheSearchResults returns a hit for the same query', async () => {
    await cacheSearchResults('Viktor', sampleResponse);

    const cached = await getCachedSearchResults('viktor');
    expect(cached?.data[0]?.name).toBe('Vi Destructive');
  });

  test('getCachedSearchResults ignores expired entries', async () => {
    const expiredEntry = {
      query: 'viktor',
      cachedAt: Date.now() - 2 * 60 * 60 * 1000,
      response: sampleResponse,
    };
    memoryStorage.store.set(
      'riftbound_search_cache',
      JSON.stringify([expiredEntry])
    );

    expect(await getCachedSearchResults('viktor')).toBeNull();
  });

  test('filterHistoryLocally matches partial queries', async () => {
    await addSearchHistoryItem('Vi Destructive');
    await addSearchHistoryItem('Jinx Rebel');
    const history = await getSearchHistory();

    expect(filterHistoryLocally(history, 'jin').map((item) => item.query)).toEqual([
      'Jinx Rebel',
    ]);
  });

  test('addSearchHistoryItem ignores queries shorter than min length', async () => {
    await addSearchHistoryItem('ab');
    expect(await getSearchHistory()).toEqual([]);
  });

  test('clearSearchHistory removes all entries', async () => {
    await addSearchHistoryItem('Viktor');
    await clearSearchHistory();
    expect(await getSearchHistory()).toEqual([]);
  });
});
