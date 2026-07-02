import { Elysia } from 'elysia';
import { desc, eq } from 'drizzle-orm';
import { filterSnapshots, syncState } from '../db/schema.js';
import type { Database } from '../db/client.js';

export function createFiltersRoutes(db: Database) {
  return new Elysia({ prefix: '/v1/filters' }).get(
    '/',
    async () => {
      const latest = await db.query.filterSnapshots.findFirst({
        orderBy: [desc(filterSnapshots.capturedAt)],
      });
      const catalog = await db.query.syncState.findFirst({
        where: eq(syncState.key, 'catalog'),
      });

      return {
        data: latest?.snapshot ?? {
          colors: [],
          sets: [],
          types: [],
          supertypes: [],
          rarities: [],
          variants: [],
        },
        meta: {
          cachedAt: (latest?.capturedAt ?? new Date()).toISOString(),
          catalogHash: catalog?.contentHash ?? '',
        },
      };
    },
    { detail: { tags: ['filters'] } }
  );
}
