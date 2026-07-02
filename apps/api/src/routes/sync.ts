import { Elysia } from 'elysia';
import type { Env } from '../env.js';
import type { SyncEngine } from '../services/sync-engine.js';
import type { PriceCacheService } from '../services/price-cache.js';
import { sql } from 'drizzle-orm';
import type { Database } from '../db/client.js';

function assertAdmin(env: Env, authorization?: string) {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (token !== env.ADMIN_SYNC_TOKEN) {
    throw new Error('Unauthorized');
  }
}

export function createSyncRoutes(
  sync: SyncEngine,
  prices: PriceCacheService,
  env: Env
) {
  return new Elysia({ prefix: '/v1/sync' })
    .get('/status', async () => ({ data: await sync.getStatus() }))
    .post('/catalog', async ({ headers }) => {
      assertAdmin(env, headers.authorization);
      const result = await sync.syncCatalog();
      return { data: result };
    })
    .post('/prices', async ({ headers }) => {
      assertAdmin(env, headers.authorization);
      const result = await prices.syncFromUpstream();
      return { data: result };
    });
}

export function createHealthRoutes(db: Database, sync: SyncEngine) {
  return new Elysia({ prefix: '/v1' }).get('/health', async () => {
    let dbStatus: 'ok' | 'error' = 'error';
    try {
      await db.execute(sql`select 1`);
      dbStatus = 'ok';
    } catch {
      dbStatus = 'error';
    }
    const status = await sync.getStatus();
    return {
      data: {
        status: 'ok' as const,
        db: dbStatus,
        lastCatalogSync: status.catalog.lastRun,
      },
    };
  });
}
