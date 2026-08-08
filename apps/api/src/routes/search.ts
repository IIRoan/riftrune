import { Elysia } from 'elysia';
import { GlobalSearchQuery, GlobalSearchResponse } from '@riftbound/contracts';
import type { CardCacheService } from '../services/card-cache.js';

export function createSearchRoutes(cards: CardCacheService) {
  return new Elysia({ prefix: '/api/v1/search' }).get(
    '/',
    async ({ query, set }) => {
      const parsed = GlobalSearchQuery.parse(query);
      const result = await cards.globalSearch(parsed);
      set.headers['cache-control'] = 'public, max-age=60, stale-while-revalidate=30';
      return GlobalSearchResponse.parse(result);
    },
    { detail: { tags: ['search'] } }
  );
}
