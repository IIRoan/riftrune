import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { CardListItem } from '@riftbound/contracts';
import { createMemoryAsyncStorage } from '../test/memory-async-storage';

const memoryStorage = createMemoryAsyncStorage();
memoryStorage.install();

const getCatalogIndex = mock(async () => ({
  data: [sampleCard],
  meta: {
    catalogHash: 'hash-v2',
    pricesCatalogHash: 'prices-v2',
    total: 1,
    source: 'cache' as const,
  },
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
  catalogIndexCacheMatches,
  catalogIndexSizeLooksStale,
  clearPersistedCatalogIndex,
  fetchAndPersistCatalogIndex,
  getInMemoryCatalogIndex,
  mergeCatalogIndexItems,
  persistCatalogIndex,
  readPersistedCatalogIndex,
  shouldReplaceCatalogPrices,
  syncCatalogIndex,
} = await import('./catalogIndexService');

beforeEach(async () => {
  memoryStorage.clear();
  getCatalogIndex.mockClear();
  await clearPersistedCatalogIndex();
});

describe('catalogIndexService', () => {
  test('persistCatalogIndex writes to memory and AsyncStorage', async () => {
    await persistCatalogIndex('hash-v1', 'prices-v1', [sampleCard]);

    const inMemory = getInMemoryCatalogIndex();
    expect(inMemory?.catalogHash).toBe('hash-v1');
    expect(inMemory?.pricesCatalogHash).toBe('prices-v1');
    expect(inMemory?.items).toHaveLength(1);

    const persisted = await readPersistedCatalogIndex();
    expect(persisted?.catalogHash).toBe('hash-v1');
    expect(persisted?.pricesCatalogHash).toBe('prices-v1');
    expect(persisted?.items[0]?.name).toBe('Vi Destructive');
  });

  test('catalogIndexCacheMatches requires both catalog and prices hashes', () => {
    expect(
      catalogIndexCacheMatches(
        { catalogHash: 'hash-v1', pricesCatalogHash: 'prices-v1' },
        { catalogHash: 'hash-v1', pricesCatalogHash: 'prices-v1' }
      )
    ).toBe(true);
    expect(
      catalogIndexCacheMatches(
        { catalogHash: 'hash-v1', pricesCatalogHash: 'prices-v1' },
        { catalogHash: 'hash-v1', pricesCatalogHash: 'prices-v2' }
      )
    ).toBe(false);
  });

  test('catalogIndexSizeLooksStale detects a truncated local cache', () => {
    expect(catalogIndexSizeLooksStale(100, 1335)).toBe(true);
    expect(catalogIndexSizeLooksStale(1200, 1335)).toBe(false);
    expect(catalogIndexSizeLooksStale(0, 1335)).toBe(false);
  });

  test('shouldReplaceCatalogPrices rejects unpriced overwrites of priced rows', () => {
    const priced = {
      ...sampleCard,
      priceEur: {
        currency: 'EUR' as const,
        low: 1,
        market: 422,
        avg7d: null,
        isFoil: true,
      },
      printings: [
        {
          variantNumber: 'OGN-001',
          variantLabel: 'Standard',
          isFoil: false,
          priceEur: {
            currency: 'EUR' as const,
            low: 1,
            market: 422,
            avg7d: null,
            isFoil: true,
          },
        },
      ],
    } satisfies CardListItem;
    const blank = {
      ...sampleCard,
      priceEur: null,
      printings: [
        {
          variantNumber: 'OGN-001',
          variantLabel: 'Standard',
          isFoil: false,
          priceEur: null,
        },
      ],
    } satisfies CardListItem;

    expect(shouldReplaceCatalogPrices(priced, blank)).toBe(false);
    expect(shouldReplaceCatalogPrices(blank, priced)).toBe(true);
  });

  test('fetchAndPersistCatalogIndex downloads when local size looks truncated', async () => {
    await persistCatalogIndex('hash-v1', 'prices-v1', [sampleCard]);

    const result = await fetchAndPersistCatalogIndex({
      catalogHash: 'hash-v1',
      pricesCatalogHash: 'prices-v1',
      variantCount: 2000,
    });

    expect(getCatalogIndex).toHaveBeenCalledTimes(1);
    expect(result.catalogHash).toBe('hash-v2');
  });

  test('fetchAndPersistCatalogIndex reuses cache when both hashes match', async () => {
    await persistCatalogIndex('hash-v1', 'prices-v1', [sampleCard]);

    const result = await fetchAndPersistCatalogIndex({
      catalogHash: 'hash-v1',
      pricesCatalogHash: 'prices-v1',
    });

    expect(getCatalogIndex).toHaveBeenCalledTimes(0);
    expect(result.catalogHash).toBe('hash-v1');
    expect(result.pricesCatalogHash).toBe('prices-v1');
    expect(result.items).toHaveLength(1);
  });

  test('fetchAndPersistCatalogIndex downloads when catalog hash differs', async () => {
    await persistCatalogIndex('hash-v1', 'prices-v1', [sampleCard]);

    const result = await fetchAndPersistCatalogIndex({
      catalogHash: 'hash-v2',
      pricesCatalogHash: 'prices-v1',
    });

    expect(getCatalogIndex).toHaveBeenCalledTimes(1);
    expect(result.catalogHash).toBe('hash-v2');
    expect(result.pricesCatalogHash).toBe('prices-v2');
    expect(result.items[0]?.name).toBe('Vi Destructive');
  });

  test('fetchAndPersistCatalogIndex downloads when prices hash differs', async () => {
    await persistCatalogIndex('hash-v1', 'prices-v1', [sampleCard]);

    const result = await fetchAndPersistCatalogIndex({
      catalogHash: 'hash-v1',
      pricesCatalogHash: 'prices-v2',
    });

    expect(getCatalogIndex).toHaveBeenCalledTimes(1);
    expect(result.catalogHash).toBe('hash-v2');
    expect(result.pricesCatalogHash).toBe('prices-v2');
  });

  test('fetchAndPersistCatalogIndex downloads when no cache exists', async () => {
    const result = await fetchAndPersistCatalogIndex({
      catalogHash: 'hash-v2',
      pricesCatalogHash: 'prices-v2',
    });

    expect(getCatalogIndex).toHaveBeenCalledTimes(1);
    expect(result.catalogHash).toBe('hash-v2');
    expect(result.pricesCatalogHash).toBe('prices-v2');
  });

  test('syncCatalogIndex reuses persisted cache without downloading', async () => {
    await persistCatalogIndex('hash-v1', 'prices-v1', [sampleCard]);

    const result = await syncCatalogIndex(async () => ({
      catalogHash: 'hash-v1',
      pricesCatalogHash: 'prices-v1',
    }));

    expect(getCatalogIndex).toHaveBeenCalledTimes(0);
    expect(result.items).toHaveLength(1);
  });

  test('mergeCatalogIndexItems appends cards missing from the local index', async () => {
    await persistCatalogIndex('hash-v1', 'prices-v1', [sampleCard]);

    const newCard = {
      ...sampleCard,
      cardId: '00000000-0000-0000-0000-000000000002',
      variantNumber: 'UNL-135',
      name: 'Insightful Investigator',
    } satisfies CardListItem;

    const added = await mergeCatalogIndexItems([newCard, sampleCard]);
    expect(added).toBe(1);

    const indexed = getInMemoryCatalogIndex();
    expect(indexed?.items).toHaveLength(2);
    expect(indexed?.items.some((card) => card.variantNumber === 'UNL-135')).toBe(true);
  });

  test('mergeCatalogIndexItems refreshes stale prices on existing cards', async () => {
    await persistCatalogIndex('hash-v1', 'prices-v1', [sampleCard]);

    const priced = {
      ...sampleCard,
      cardmarketId: 100,
      priceEur: {
        currency: 'EUR' as const,
        low: 38.98,
        market: 50,
        avg7d: 50,
        isFoil: false,
      },
      printings: [
        {
          variantNumber: 'OGN-001',
          variantLabel: 'Standard',
          isFoil: false,
          priceEur: {
            currency: 'EUR' as const,
            low: 38.98,
            market: 50,
            avg7d: 50,
            isFoil: false,
          },
        },
      ],
    } satisfies CardListItem;

    const changed = await mergeCatalogIndexItems([priced]);
    expect(changed).toBe(1);

    const indexed = getInMemoryCatalogIndex();
    expect(indexed?.items).toHaveLength(1);
    expect(indexed?.items[0]?.priceEur?.market).toBe(50);
    expect(indexed?.items[0]?.printings[0]?.priceEur?.market).toBe(50);
  });

  test('mergeCatalogIndexItems does not clobber a priced row with an unpriced snapshot', async () => {
    const priced = {
      ...sampleCard,
      cardmarketId: 867013,
      priceEur: {
        currency: 'EUR' as const,
        low: 890,
        market: 422.1,
        avg7d: null,
        isFoil: true,
      },
      printings: [
        {
          variantNumber: 'SFD-239*',
          variantLabel: 'Overnumbered Signed',
          isFoil: false,
          priceEur: {
            currency: 'EUR' as const,
            low: 890,
            market: 422.1,
            avg7d: null,
            isFoil: true,
          },
        },
      ],
      variantNumber: 'SFD-239*',
      name: 'Soraka, Wanderer',
    } satisfies CardListItem;

    await persistCatalogIndex('hash-v1', 'prices-v1', [priced]);

    const blank = {
      ...priced,
      priceEur: null,
      printings: [
        {
          variantNumber: 'SFD-239*',
          variantLabel: 'Overnumbered Signed',
          isFoil: false,
          priceEur: null,
        },
      ],
    } satisfies CardListItem;

    const changed = await mergeCatalogIndexItems([blank]);
    expect(changed).toBe(0);
    expect(getInMemoryCatalogIndex()?.items[0]?.priceEur?.market).toBe(422.1);
  });

  test('clearPersistedCatalogIndex removes memory and storage', async () => {
    await persistCatalogIndex('hash-v1', 'prices-v1', [sampleCard]);
    await clearPersistedCatalogIndex();

    expect(getInMemoryCatalogIndex()).toBeNull();
    expect(await readPersistedCatalogIndex()).toBeNull();
  });
});
