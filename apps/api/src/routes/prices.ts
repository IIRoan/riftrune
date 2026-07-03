import { Elysia } from 'elysia';
import {
  PriceHistoryQuery,
  PriceHistoryResponse,
  PricesListQuery,
} from '@riftbound/contracts';
import type { PriceCacheService } from '../services/price-cache.js';
import { eq } from 'drizzle-orm';
import { variants } from '../db/schema.js';
import type { Database } from '../db/client.js';

async function resolveCardmarketId(
  db: Database,
  variantNumber: string | undefined,
  cardmarketId: number | undefined
): Promise<number | undefined> {
  if (!variantNumber || cardmarketId !== undefined) return cardmarketId;
  const row = await db.query.variants.findFirst({
    where: eq(variants.variantNumber, variantNumber),
  });
  return row?.cardmarketId ?? undefined;
}

export function createPricesRoutes(prices: PriceCacheService, db: Database) {
  return new Elysia({ prefix: '/api/v1/prices' })
    .get(
      '/',
      async ({ query }) => {
        const parsed = PricesListQuery.parse(query);
        const cardmarketId = await resolveCardmarketId(
          db,
          parsed.variantNumber,
          parsed.cardmarketId
        );

        const listQuery: { cardmarketId?: number; isFoil?: boolean } = {};
        if (cardmarketId !== undefined) listQuery.cardmarketId = cardmarketId;
        if (parsed.isFoil !== undefined) listQuery.isFoil = parsed.isFoil;

        const result = await prices.list(listQuery);

        return {
          data: result.rows,
          meta: {
            pricesCatalogHash: result.catalogHash,
            lastSyncedAt: result.lastSyncedAt,
            rowCount: result.rows.length,
          },
        };
      },
      { detail: { tags: ['prices'] } }
    )
    .get(
      '/history',
      async ({ query }) => {
        const parsed = PriceHistoryQuery.parse(query);
        const cardmarketId = await resolveCardmarketId(
          db,
          parsed.variantNumber,
          parsed.cardmarketId
        );

        if (cardmarketId === undefined) {
          return PriceHistoryResponse.parse({
            data: [],
            meta: {
              cardmarketId: null,
              isFoil: parsed.isFoil ?? null,
              days: parsed.days,
              rowCount: 0,
            },
          });
        }

        const historyQuery: {
          cardmarketId: number;
          isFoil?: boolean;
          days: number;
        } = {
          cardmarketId,
          days: parsed.days,
        };
        if (parsed.isFoil !== undefined) historyQuery.isFoil = parsed.isFoil;

        const result = await prices.history(historyQuery);

        return PriceHistoryResponse.parse({
          data: result.rows,
          meta: {
            cardmarketId,
            isFoil: parsed.isFoil ?? null,
            days: parsed.days,
            rowCount: result.rows.length,
          },
        });
      },
      { detail: { tags: ['prices'] } }
    );
}
