import { Elysia } from 'elysia';
import type { Env } from '../env.js';
import type { SyncEngine } from '../services/sync-engine.js';
import type { PriceCacheService } from '../services/price-cache.js';
import type { CardCacheService } from '../services/card-cache.js';
import { sql } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { isAdminAuthorization } from '../lib/admin-token.js';
import { isEmailConfigured } from '../lib/email.js';

function adminUnauthorized() {
  return { error: 'UNAUTHORIZED' as const, message: 'Admin token required' };
}

export function createSyncRoutes(
  sync: SyncEngine,
  prices: PriceCacheService,
  cards: CardCacheService,
  env: Env
) {
  return new Elysia({ prefix: '/api/v1/sync' })
    .get('/status', async ({ headers, set }) => {
      if (!isAdminAuthorization(env, headers.authorization)) {
        set.status = 401;
        return adminUnauthorized();
      }
      return { data: await sync.getStatus() };
    })
    .post('/catalog', async ({ headers, set }) => {
      if (!isAdminAuthorization(env, headers.authorization)) {
        set.status = 401;
        return adminUnauthorized();
      }
      const result = await sync.syncCatalog();
      return { data: result };
    })
    .post('/prices', async ({ headers, set }) => {
      if (!isAdminAuthorization(env, headers.authorization)) {
        set.status = 401;
        return adminUnauthorized();
      }
      console.log(
        `[prices] Admin sync requested via POST /api/v1/sync/prices (game=${String(env.CARDMARKET_GAME_ID)})`
      );
      const result = await prices.syncFromCardmarket(env.CARDMARKET_GAME_ID, {
        trigger: 'http',
      });
      if (result.changed) {
        cards.invalidateSearchCache();
        console.log('[prices] Search cache invalidated after price change');
      } else if (result.cardmarketIdsBackfilled > 0) {
        cards.invalidateSearchCache();
        console.log('[prices] Search cache invalidated after Cardmarket id backfill');
      } else {
        console.log('[prices] Prices unchanged; search cache left intact');
      }
      return { data: result };
    });
}

export function createHealthRoutes(db: Database, sync: SyncEngine, env: Env) {
  return new Elysia({ prefix: '/api/v1' }).get('/health', async () => {
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
        emailVerificationRequired: isEmailConfigured(env),
      },
    };
  });
}
