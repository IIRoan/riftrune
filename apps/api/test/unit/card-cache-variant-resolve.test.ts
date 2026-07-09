import { describe, expect, test } from 'bun:test';
import { PaLogicalCard } from '@riftbound/contracts';
import { CardCacheService } from '../../src/services/card-cache.js';
import type { Database } from '../../src/db/client.js';
import type { RiftruneClient } from '../../src/upstream/riftrune-client.js';

const VARIANT_ID = '0cd819d5-a03f-45d2-9e65-aec8ddae735e';
const CARD_ID = '7596dc74-82bc-41ac-a25f-83f4b98ffb72';
const VARIANT_NUMBER = 'OGS-011';

function createCardCacheHarness() {
  const upsertCalls: unknown[] = [];
  const db = {
    query: {
      variants: {
        findFirst: async () => null,
      },
      cards: {
        findFirst: async () => null,
      },
    },
  } as unknown as Database;

  const riftrune = {
    listCards: async ({ page }: { page?: number }) => ({
      data:
        page === 4
          ? [
              {
                id: VARIANT_ID,
                variantNumber: VARIANT_NUMBER,
                rarity: 'Common',
                variantType: 'Standard',
                foilMode: 'None',
                variantTypes: ['Standard'],
                imageUrl: 'https://example.com/ogs-011.webp',
                variantLabel: 'Standard',
                showInLibrary: true,
                isCollectible: true,
                set: {
                  id: '4583bc2e-da65-492f-97dc-4876988048d7',
                  name: 'OGS',
                  prefix: 'OGS',
                },
                card: { id: CARD_ID, name: 'Flash' },
              },
            ]
          : [],
      pagination: {
        total: 400,
        page: page ?? 1,
        limit: 100,
        totalPages: 4,
        hasNext: (page ?? 1) < 4,
        hasPrevious: (page ?? 1) > 1,
      },
      meta: { filters: {} },
    }),
    getCard: async (variantNumber: string) =>
      PaLogicalCard.parse({
        id: CARD_ID,
        name: 'Flash',
        type: 'Spell',
        super: null,
        description: '',
        energy: 1,
        might: 0,
        power: 0,
        tags: [],
        colors: [
          {
            id: '4583bc2e-da65-492f-97dc-4876988048d7',
            name: 'Calm',
          },
        ],
        variants: [
          {
            id: VARIANT_ID,
            variantNumber,
            rarity: 'Common',
            variantType: 'Standard',
            foilMode: 'None',
            variantTypes: ['Standard'],
            imageUrl: 'https://example.com/ogs-011.webp',
            variantLabel: 'Standard',
            showInLibrary: true,
            isCollectible: true,
            set: {
              id: '4583bc2e-da65-492f-97dc-4876988048d7',
              name: 'OGS',
              prefix: 'OGS',
            },
          },
        ],
      }),
  } as unknown as RiftruneClient;

  const cards = new CardCacheService(
    db,
    riftrune,
    { getRowsForCardmarketIds: async () => [] } as never,
    { rewriteCard: (card: PaLogicalCard) => card, rewriteImageUrl: (url: string) => url } as never
  );

  const originalUpsert = cards.upsertFromUpstream.bind(cards);
  cards.upsertFromUpstream = async (card) => {
    upsertCalls.push(card);
    return true;
  };

  return { cards, upsertCalls, originalUpsert };
}

describe('CardCacheService.resolveVariantNumberByUpstreamId', () => {
  test('discovers missing variants from upstream catalog list pages', async () => {
    const { cards, upsertCalls } = createCardCacheHarness();

    const variantNumber = await cards.resolveVariantNumberByUpstreamId(VARIANT_ID, CARD_ID);

    expect(variantNumber).toBe(VARIANT_NUMBER);
    expect(upsertCalls).toHaveLength(1);
    expect((upsertCalls[0] as PaLogicalCard).name).toBe('Flash');
  });
});
