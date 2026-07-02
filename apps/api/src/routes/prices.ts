import { Elysia } from 'elysia';
import { PricesListQuery } from '@riftbound/contracts';
import type { PriceCacheService } from '../services/price-cache.js';
import { eq } from 'drizzle-orm';
import { variants } from '../db/schema.js';
import type { Database } from '../db/client.js';

export function createPricesRoutes(prices: PriceCacheService, db: Database) {
  return new Elysia({ prefix: '/v1/prices' }).get(
    '/',
    async ({ query }) => {
      const parsed = PricesListQuery.parse(query);
      let cardmarketId = parsed.cardmarketId;

      if (parsed.variantNumber && cardmarketId === undefined) {
        const row = await db.query.variants.findFirst({
          where: eq(variants.variantNumber, parsed.variantNumber),
        });
        cardmarketId = row?.cardmarketId ?? undefined;
      }

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
  );
}
