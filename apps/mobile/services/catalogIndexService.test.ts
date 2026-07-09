import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { CardListItem } from '@riftbound/contracts';
import { createMemoryAsyncStorage } from '../test/memory-async-storage';

const memoryStorage = createMemoryAsyncStorage();
memoryStorage.install();

const getCatalogIndex = mock(async () => ({
  data: [sampleCard],
  meta: { catalogHash: 'hash-v2', total: 1, source: 'cache' as const },
}));

mock.module('@/src/api/client', () => ({
  api: {
    getCatalogIndex,
  },
}));

const sampleCard = {
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
} satisfies CardListItem;

const {
  clearPersistedCatalogIndex,
  fetchAndPersistCatalogIndex,
  getInMemoryCatalogIndex,
  persistCatalogIndex,
  readPersistedCatalogIndex,
} = await import('./catalogIndexService');

beforeEach(async () => {
  memoryStorage.clear();
  getCatalogIndex.mockClear();
  await clearPersistedCatalogIndex();
});

describe('catalogIndexService', () => {
  test('persistCatalogIndex writes to memory and AsyncStorage', async () => {
    await persistCatalogIndex('hash-v1', [sampleCard]);

    const inMemory = getInMemoryCatalogIndex();
    expect(inMemory?.catalogHash).toBe('hash-v1');
    expect(inMemory?.items).toHaveLength(1);

    const persisted = await readPersistedCatalogIndex();
    expect(persisted?.catalogHash).toBe('hash-v1');
    expect(persisted?.items[0]?.name).toBe('Vi Destructive');
  });

  test('fetchAndPersistCatalogIndex reuses cache when catalogHash matches', async () => {
    await persistCatalogIndex('hash-v1', [sampleCard]);

    const result = await fetchAndPersistCatalogIndex('hash-v1');

    expect(getCatalogIndex).toHaveBeenCalledTimes(0);
    expect(result.catalogHash).toBe('hash-v1');
    expect(result.items).toHaveLength(1);
  });

  test('fetchAndPersistCatalogIndex downloads when hash differs', async () => {
    await persistCatalogIndex('hash-v1', [sampleCard]);

    const result = await fetchAndPersistCatalogIndex('hash-v2');

    expect(getCatalogIndex).toHaveBeenCalledTimes(1);
    expect(result.catalogHash).toBe('hash-v2');
    expect(result.items[0]?.name).toBe('Vi Destructive');
  });

  test('fetchAndPersistCatalogIndex downloads when no cache exists', async () => {
    const result = await fetchAndPersistCatalogIndex('hash-v2');

    expect(getCatalogIndex).toHaveBeenCalledTimes(1);
    expect(result.catalogHash).toBe('hash-v2');
  });

  test('clearPersistedCatalogIndex removes memory and storage', async () => {
    await persistCatalogIndex('hash-v1', [sampleCard]);
    await clearPersistedCatalogIndex();

    expect(getInMemoryCatalogIndex()).toBeNull();
    expect(await readPersistedCatalogIndex()).toBeNull();
  });
});
