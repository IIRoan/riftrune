import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import type postgres from 'postgres';
import { createAuth, type Auth } from './auth.js';
import { createDb, type Database } from './db/client.js';
import type { Env } from './env.js';
import { resolveCorsOrigins } from './lib/trusted-origins.js';
import { createAuthPlugin } from './plugins/auth.js';
import { errorPlugin } from './plugins/error-handler.js';
import { createCardsRoutes } from './routes/cards.js';
import { createImagesRoutes } from './routes/images.js';
import { createCollectionRoutes } from './routes/collection.js';
import { createFiltersRoutes } from './routes/filters.js';
import { createPricesRoutes } from './routes/prices.js';
import { createHealthRoutes, createSyncRoutes } from './routes/sync.js';
import { createWishlistRoutes } from './routes/wishlist.js';
import { CardCacheService } from './services/card-cache.js';
import { ImageStoreService } from './services/image-store.js';
import { CatalogMetadataService } from './services/catalog-metadata.js';
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
  catalogMetadata: CatalogMetadataService;
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
  const imageStore = new ImageStoreService(env);
  const cardCache = new CardCacheService(db, riftrune, priceCache, imageStore);
  const catalogMetadata = new CatalogMetadataService(db, riftrune);
  const syncEngine = new SyncEngine(db, riftrune, cardCache, catalogMetadata);
  const collectionService = new CollectionService(db, cardCache, imageStore, riftrune);
  const wishlistService = new WishlistService(db, imageStore);

  const app = new Elysia()
    .use(
      cors({
        origin: resolveCorsOrigins(env),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      })
    );

  if (env.SWAGGER_ENABLED) {
    app.use(
      swagger({
        documentation: {
          info: {
            title: 'Riftbound API',
            version: '1.0.0',
            description: 'Cached riftrune.com card catalog + Cardmarket prices',
          },
        },
      })
    );
  }

  app
    .use(errorPlugin)
    .use(authPlugin)
    .use(createHealthRoutes(db, syncEngine))
    .use(createImagesRoutes(imageStore))
    .use(createCardsRoutes(cardCache, env))
    .use(createPricesRoutes(priceCache, db))
    .use(createFiltersRoutes(catalogMetadata))
    .use(createCollectionRoutes(collectionService, auth))
    .use(createWishlistRoutes(wishlistService, auth))
    .use(createSyncRoutes(syncEngine, priceCache, env))
    .get('/', () => ({
      name: 'riftrune-api',
      docs: '/swagger',
      health: '/api/v1/health',
      auth: '/api/auth',
    }));

  return {
    app,
    db,
    client,
    auth,
    riftrune,
    cardCache,
    catalogMetadata,
    priceCache,
    syncEngine,
    collectionService,
    wishlistService,
  } as unknown as AppContext;
}

export function createApp(env: Env): AppContext {
  return buildApp(env);
}

export function startCatalogMetadataWarmup(ctx: AppContext, env: Env): void {
  if (!env.CATALOG_WARMUP_ON_START || process.env.CATALOG_PROBE_DISABLED === 'true') {
    return;
  }

  void ctx.catalogMetadata.ensureExpandedPrintCounts().catch((err: unknown) => {
    console.error('Catalog metadata warmup failed:', err);
  });
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
