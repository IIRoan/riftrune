import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import type postgres from 'postgres';
import { createAuth, type Auth } from './auth.js';
import { createDb, type Database } from './db/client.js';
import type { Env } from './env.js';
import { createAuthPlugin } from './plugins/auth.js';
import { errorPlugin } from './plugins/error-handler.js';
import { createCardsRoutes } from './routes/cards.js';
import { createCollectionRoutes } from './routes/collection.js';
import { createFiltersRoutes } from './routes/filters.js';
import { createPricesRoutes } from './routes/prices.js';
import { createHealthRoutes, createSyncRoutes } from './routes/sync.js';
import { createWishlistRoutes } from './routes/wishlist.js';
import { CardCacheService } from './services/card-cache.js';
import { CollectionService } from './services/collection-service.js';
import { PriceCacheService } from './services/price-cache.js';
import { SyncEngine } from './services/sync-engine.js';
import { WishlistService } from './services/wishlist-service.js';
import { RiftruneClient } from './upstream/riftrune-client.js';

export interface AppContext {
  app: Elysia;
  db: Database;
  client: postgres.Sql;
  auth: Auth;
  riftrune: RiftruneClient;
  cardCache: CardCacheService;
  priceCache: PriceCacheService;
  syncEngine: SyncEngine;
  collectionService: CollectionService;
  wishlistService: WishlistService;
}

function buildApp(env: Env): AppContext {
  const { db, client } = createDb(env);
  const auth = createAuth(db, env);
  const authPlugin = createAuthPlugin(auth);
  const riftrune = new RiftruneClient(env);
  const priceCache = new PriceCacheService(db, riftrune);
  const cardCache = new CardCacheService(db, riftrune, priceCache);
  const syncEngine = new SyncEngine(db, riftrune, cardCache);
  const collectionService = new CollectionService(db);
  const wishlistService = new WishlistService(db);

  const app = new Elysia()
    .use(
      cors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
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
    .use(authPlugin)
    .use(createHealthRoutes(db, syncEngine))
    .use(createCardsRoutes(cardCache, env))
    .use(createPricesRoutes(priceCache, db))
    .use(createFiltersRoutes(db))
    .use(createCollectionRoutes(collectionService, auth))
    .use(createWishlistRoutes(wishlistService, auth))
    .use(createSyncRoutes(syncEngine, priceCache, env))
    .get('/', () => ({
      name: 'riftrune-api',
      docs: '/swagger',
      health: '/v1/health',
      auth: '/api/auth',
    }));

  return {
    app,
    db,
    client,
    auth,
    riftrune,
    cardCache,
    priceCache,
    syncEngine,
    collectionService,
    wishlistService,
  } as unknown as AppContext;
}

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
