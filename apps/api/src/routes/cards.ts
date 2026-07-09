import { Elysia } from 'elysia';
import { CardsBatchRequest, CardsListQuery } from '@riftbound/contracts';
import type { CardCacheService } from '../services/card-cache.js';
import type { Env } from '../env.js';

export function createCardsRoutes(cards: CardCacheService, _env: Env) {
  return new Elysia({ prefix: '/api/v1/cards' })
    .get(
      '/',
      async ({ query, set }) => {
        const parsed = CardsListQuery.parse(query);
        const result = await cards.search(parsed);
        const totalPages = Math.ceil(result.total / parsed.limit) || 1;

        if (!parsed.refresh) {
          set.headers['cache-control'] = 'public, max-age=300, stale-while-revalidate=60';
        }

        return {
          data: result.items,
          meta: {
            pagination: {
              total: result.total,
              page: parsed.page,
              limit: parsed.limit,
              totalPages,
              hasNext: parsed.page < totalPages,
              hasPrevious: parsed.page > 1,
            },
            source: result.source,
            catalogHash: result.catalogHash,
          },
        };
      },
      { detail: { tags: ['cards'] } }
    )
    .get(
      '/index',
      async ({ set }) => {
        const result = await cards.listIndex();
        set.headers['cache-control'] = 'public, max-age=300, stale-while-revalidate=60';
        return {
          data: result.items,
          meta: {
            catalogHash: result.catalogHash,
            total: result.total,
            source: 'cache' as const,
          },
        };
      },
      { detail: { tags: ['cards'] } }
    )
    .get(
      '/:variantNumber',
      async ({ params, query }) => {
        const refresh = query.refresh === 'true';
        const result = await cards.getByVariantNumber(params.variantNumber, {
          refresh,
        });
        return {
          data: result.detail,
          meta: { source: result.source, contentHash: result.contentHash },
        };
      },
      { detail: { tags: ['cards'] } }
    )
    .post(
      '/batch',
      async ({ body }) => {
        const { variantNumbers } = CardsBatchRequest.parse(body);
        const result = await cards.batchGet(variantNumbers);
        return {
          data: result.found,
          meta: {
            found: result.found.length,
            notFound: result.notFound,
            source: result.source,
          },
        };
      },
      { detail: { tags: ['cards'] } }
    );
}
