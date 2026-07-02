import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { createDb } from './db/client.js';
import type { Env } from './env.js';
import { errorPlugin } from './plugins/error-handler.js';
import { createCardsRoutes } from './routes/cards.js';
import { createFiltersRoutes } from './routes/filters.js';
import { createPricesRoutes } from './routes/prices.js';
import { createHealthRoutes, createSyncRoutes } from './routes/sync.js';
import { CardCacheService } from './services/card-cache.js';
import { PriceCacheService } from './services/price-cache.js';
import { SyncEngine } from './services/sync-engine.js';
import { RiftruneClient } from './upstream/riftrune-client.js';

function buildApp(env: Env) {
  const { db, client } = createDb(env);
  const riftrune = new RiftruneClient(env);
  const priceCache = new PriceCacheService(db, riftrune);
  const cardCache = new CardCacheService(db, riftrune, priceCache);
  const syncEngine = new SyncEngine(db, riftrune, cardCache);

  const app = new Elysia()
    .use(
      cors({
        origin: true,
        methods: ['GET', 'POST', 'OPTIONS'],
      })
    )
    .use(
      swagger({
        documentation: {
          info: {
            title: 'Riftbound API',
            version: '1.0.0',
            description: 'Cached riftrune.com card catalog + Cardmarket prices',
          },
        },
      })
    )
    .use(errorPlugin)
    .use(createHealthRoutes(db, syncEngine))
    .use(createCardsRoutes(cardCache, env))
    .use(createPricesRoutes(priceCache, db))
    .use(createFiltersRoutes(db))
    .use(createSyncRoutes(syncEngine, priceCache, env))
    .get('/', () => ({
      name: 'riftrune-api',
      docs: '/swagger',
      health: '/v1/health',
    }));

  return { app, db, client, riftrune, cardCache, priceCache, syncEngine };
}

export type AppContext = ReturnType<typeof buildApp>;

export function createApp(env: Env): AppContext {
  return buildApp(env);
}

export function startSyncCrons(ctx: AppContext, env: Env): void {
  if (!env.SYNC_CRON_ENABLED) return;

  const SIX_HOURS = 6 * 60 * 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  setInterval(() => {
    void ctx.syncEngine.syncCatalog().catch((err: unknown) => {
      console.error('Catalog sync failed:', err);
    });
  }, SIX_HOURS);

  setInterval(() => {
    void ctx.priceCache.syncFromUpstream().catch((err: unknown) => {
      console.error('Price sync failed:', err);
    });
  }, ONE_DAY);
}
