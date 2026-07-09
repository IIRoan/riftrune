import { describe, expect, test } from 'bun:test';
import type { DeckListItem } from '@riftbound/contracts';
import { DeckSyncService } from '../../src/services/deck-sync.js';

const upstreamListFixture = {
  data: [
    {
      id: 'deck-alpha',
      name: 'Alpha Deck',
      description: 'First test deck',
      createdAt: '2026-06-21T23:06:49.975Z',
      editedAt: '2026-06-25T01:22:05.612Z',
      legend: {
        id: 'legend-1',
        name: 'Master Yi, Wuju Bladesman',
        variantNumber: 'OGS-019',
        tags: [],
      },
    },
    {
      id: 'deck-beta',
      name: 'Beta Deck',
      description: null,
      createdAt: '2026-06-14T21:14:51.322Z',
      editedAt: '2026-06-18T20:17:53.353Z',
      legend: {
        id: 'legend-2',
        name: 'Viktor, Herald of the Arcane',
        variantNumber: 'OGN-265',
        tags: [],
      },
    },
    {
      id: 'deck-owned-skip',
      name: 'Already owned upstream deck',
      description: null,
      createdAt: '2026-06-14T21:14:51.322Z',
      legend: null,
    },
  ],
};

function createDeckSyncForTest() {
  let listCalls = 0;
  let detailCalls = 0;

  const riftrune = {
    listDecks: async () => {
      listCalls += 1;
      return upstreamListFixture;
    },
    getDeck: async () => {
      detailCalls += 1;
      throw new Error('getDeck should not be called for list summaries');
    },
  };

  const cardCache = {
    getByVariantNumber: async (variantNumber: string) => ({
      detail: {
        id: `card-${variantNumber}`,
        name: `Legend ${variantNumber}`,
        type: 'Unit',
        super: 'Champion',
        tags: [],
        colors: [{ name: 'Body' }],
        energy: 0,
        variants: [
          {
            variantNumber,
            rarity: 'Rare',
            variantType: 'Standard',
          },
        ],
      },
    }),
  };

  const deckSync = new DeckSyncService(
    {} as never,
    riftrune as never,
    cardCache as never
  );

  return {
    deckSync,
    metrics: () => ({ listCalls, detailCalls }),
  };
}

describe('DeckSyncService.listImportedDeckSummaries', () => {
  test('uses upstream list only and skips owned upstream ids', async () => {
    const { deckSync, metrics } = createDeckSyncForTest();

    const items = await deckSync.listImportedDeckSummaries({
      skipIds: new Set(['deck-owned-skip']),
    });

    expect(metrics().listCalls).toBe(1);
    expect(metrics().detailCalls).toBe(0);
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.id)).toEqual(['deck-alpha', 'deck-beta']);
    expect(items.every((item) => item.source === 'imported' && item.readOnly)).toBe(true);
    expect(items[0]?.legend?.variantNumber).toBe('OGS-019');
    expect(items[0]?.mainDeck).toEqual([]);
  });

  test('filters imported summaries by query before legend enrichment', async () => {
    const { deckSync, metrics } = createDeckSyncForTest();

    const items = await deckSync.listImportedDeckSummaries({
      skipIds: new Set(),
      q: 'viktor',
    });

    expect(metrics().listCalls).toBe(1);
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe('Beta Deck');
    expect(items[0]?.legend?.name).toBe('Legend OGN-265');
  });

  test('reuses legend card cache across list entries', async () => {
    const { deckSync } = createDeckSyncForTest();
    let legendLookups = 0;
    const syncInternals = deckSync as unknown as {
      cardCache: { getByVariantNumber: (variantNumber: string) => Promise<unknown> };
    };
    const base = syncInternals.cardCache.getByVariantNumber.bind(syncInternals.cardCache);
    syncInternals.cardCache.getByVariantNumber = async (variantNumber: string) => {
      legendLookups += 1;
      return base(variantNumber);
    };

    const fixtureWithDuplicateLegend = {
      data: [
        upstreamListFixture.data[0],
        {
          ...upstreamListFixture.data[0],
          id: 'deck-alpha-copy',
          name: 'Alpha Copy',
        },
      ],
    };

    const riftrune = {
      listDecks: async () => fixtureWithDuplicateLegend,
      getDeck: async () => {
        throw new Error('unexpected detail fetch');
      },
    };
    const testSync = new DeckSyncService(
      {} as never,
      riftrune as never,
      syncInternals.cardCache as never
    );

    const items = await testSync.listImportedDeckSummaries({ skipIds: new Set() });

    expect(items).toHaveLength(2);
    expect(legendLookups).toBe(1);
    expect(items[0]?.legend).toEqual(items[1]?.legend);
  });
});

describe('imported deck list item shape', () => {
  test('summary items are valid list payloads without main deck cards', async () => {
    const { deckSync } = createDeckSyncForTest();
    const items: DeckListItem[] = await deckSync.listImportedDeckSummaries({ skipIds: new Set() });

    for (const item of items) {
      expect(item.mainDeck).toEqual([]);
      expect(item.runes).toEqual([]);
      expect(item.battlefields).toEqual([]);
      expect(item.sideboard).toEqual([]);
      expect(item.champion).toBeNull();
      expect(typeof item.createdAt).toBe('number');
      expect(typeof item.updatedAt).toBe('number');
    }
  });
});
