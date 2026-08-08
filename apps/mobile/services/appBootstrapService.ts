import type { QueryClient } from '@tanstack/react-query';
import type { CardListItem } from '@riftbound/contracts';
import {
  getCatalogIndexItems,
  hydrateCatalogIndex,
  prefetchCatalogIndex,
} from '@/hooks/useCatalogIndex';
import { hydrateCollectionCache, prefetchCollection } from '@/hooks/useCollection';
import { prefetchCollectionInsights } from '@/hooks/useCollectionInsights';
import { prefetchCollectionShareStatus } from '@/hooks/useCollectionShare';
import {
  hydrateOwnedDecksCache,
  prefetchDefaultDeckBrowse,
  prefetchOwnedDecks,
} from '@/hooks/useDecks';
import { prefetchCatalogFilters } from '@/hooks/useFiltersData';
import { prefetchPlayLegendCatalog } from '@/hooks/useLegendCatalog';
import { hydrateWishlistCache, prefetchWishlist } from '@/hooks/useWishlist';
import { prefetchWishlistPrices } from '@/hooks/useWishlistPrices';
import { prefetchCardDetail, flushCardDetailPrefetch } from '@/lib/prefetchCardDetail';
import { prefetchImageUris } from '@/lib/imagePrefetch';
import { CATALOG_ART_THUMB_WIDTH } from '@/constants/CardArt';
import {
  preloadCollectionDashboardAssets,
  preloadCriticalLocalAssets,
} from '@/lib/preloadAssets';
import type { DeckState } from '@/lib/deck-types';
import type { CollectionEntry } from '@/services/collectionService';
import { clearPersistedCollection } from '@/services/collectionCacheService';
import { clearPersistedOwnedDecks } from '@/services/deckCacheService';
import { clearPersistedWishlist } from '@/services/wishlistCacheService';
import {
  readLastCachedUserId,
  writeLastCachedUserId,
} from '@/services/userCacheScope';
import { collectionEntryToCardListItem } from '@/utils/collectionDisplay';
import { removeUserDataQueries } from '@/src/api/queryClient';
import {
  catalogQueryKeys,
  collectionQueryKeys,
  deckQueryKeys,
  wishlistQueryKeys,
} from '@/src/api/queryKeys';

export const BOOTSTRAP_PHASES = ['local', 'catalog', 'user', 'deferred'] as const;
export type BootstrapPhase = (typeof BOOTSTRAP_PHASES)[number];

/** First viewport of Cards tab art / details. */
const CATALOG_IMAGE_WARM_COUNT = 40;
/** Deck / wishlist thumbnails outside the collection dashboard. */
const USER_IMAGE_WARM_COUNT = 48;
/** Collection list rows to warm (recent-first). */
const COLLECTION_LIST_IMAGE_WARM_COUNT = 120;

type PhaseListener = (phase: BootstrapPhase) => void;

function collectionRowsForWarm(collection: CollectionEntry[]): CollectionEntry[] {
  const byVariant = new Map<string, CollectionEntry>();
  for (const entry of collection) {
    const existing = byVariant.get(entry.variantNumber);
    if (!existing || entry.updatedAt > existing.updatedAt) {
      byVariant.set(entry.variantNumber, entry);
    }
  }
  return [...byVariant.values()]
    .sort((a, b) => b.updatedAt - a.updatedAt || b.addedAt - a.addedAt)
    .slice(0, COLLECTION_LIST_IMAGE_WARM_COUNT);
}

async function warmCatalogImages(queryClient: QueryClient): Promise<void> {
  const index = queryClient.getQueryData<{ items: CardListItem[] }>(catalogQueryKeys.index);
  const items = getCatalogIndexItems(index);
  await prefetchImageUris(
    items.slice(0, CATALOG_IMAGE_WARM_COUNT).map((item) => item.imageUrl),
    { limit: CATALOG_IMAGE_WARM_COUNT, width: CATALOG_ART_THUMB_WIDTH }
  );
}

async function warmSearchCardDetails(queryClient: QueryClient): Promise<void> {
  const index = queryClient.getQueryData<{ items: CardListItem[] }>(catalogQueryKeys.index);
  const items = getCatalogIndexItems(index).slice(0, CATALOG_IMAGE_WARM_COUNT);
  for (const item of items) {
    prefetchCardDetail(queryClient, item);
  }
  await flushCardDetailPrefetch();
}

async function warmCollectionDashboard(queryClient: QueryClient): Promise<void> {
  await preloadCollectionDashboardAssets();

  const collection =
    queryClient.getQueryData<CollectionEntry[]>(collectionQueryKeys.all) ?? [];
  if (collection.length === 0) return;

  const listRows = collectionRowsForWarm(collection);

  await Promise.all([
    prefetchCollectionInsights(queryClient),
    prefetchImageUris(
      listRows.map((entry) => entry.imageUrl),
      { limit: COLLECTION_LIST_IMAGE_WARM_COUNT }
    ),
  ]);

  for (const entry of listRows.slice(0, 40)) {
    prefetchCardDetail(queryClient, collectionEntryToCardListItem(entry));
  }
  await flushCardDetailPrefetch();
}

async function warmUserImages(queryClient: QueryClient): Promise<void> {
  const decks =
    queryClient.getQueryData<DeckState[]>(deckQueryKeys.list('owned')) ?? [];
  const wishlist =
    queryClient.getQueryData<Array<{ imageUrl?: string }>>(wishlistQueryKeys.all) ?? [];
  const wishlistPrices =
    queryClient.getQueryData<Array<{ imageUrl?: string }>>(wishlistQueryKeys.prices) ?? [];

  const uris: Array<string | null | undefined> = [
    ...wishlist.map((entry) => entry.imageUrl),
    ...wishlistPrices.map((entry) => entry.imageUrl),
    ...decks.flatMap((deck) => [deck.legend?.imageUrl, deck.champion?.imageUrl]),
  ];

  await prefetchImageUris(uris, { limit: USER_IMAGE_WARM_COUNT });
}

/**
 * Disk + bundled assets — no network required.
 * Hold the splash until this phase finishes so the first frame is warm.
 */
export async function bootstrapLocal(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    hydrateCatalogIndex(queryClient),
    preloadCriticalLocalAssets(),
    preloadCollectionDashboardAssets(),
  ]);
}

/** Filters + catalog index sync — needed before tabs feel usable. */
export async function bootstrapCatalog(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    prefetchCatalogFilters(queryClient),
    prefetchCatalogIndex(queryClient),
  ]);
  await warmCatalogImages(queryClient);
}

export { prefetchOwnedDecks, prefetchWishlist };

/**
 * Drop in-memory + disk account lists when the signed-in user changes.
 * Disk caches are not user-scoped, so hydrating after session expiry / account
 * switch would otherwise paint the previous collector's collection.
 */
async function resetAccountCachesForUserSwitch(queryClient: QueryClient): Promise<void> {
  removeUserDataQueries(queryClient);
  await Promise.all([
    clearPersistedCollection(),
    clearPersistedOwnedDecks(),
    clearPersistedWishlist(),
  ]);
}

/**
 * Account-bound lists after sign-in.
 * Same user: hydrate from disk first so tabs paint instantly, then refresh.
 * Different user: clear prior caches and network-fetch only.
 */
export async function bootstrapUser(
  queryClient: QueryClient,
  options: { userId: string }
): Promise<void> {
  const { userId } = options;
  const lastUserId = await readLastCachedUserId();
  const sameUser = lastUserId === userId;

  if (!sameUser) {
    await resetAccountCachesForUserSwitch(queryClient);
  } else {
    await Promise.all([
      hydrateCollectionCache(queryClient),
      hydrateOwnedDecksCache(queryClient),
      hydrateWishlistCache(queryClient),
    ]);
    // Paint collection dashboard from disk immediately, then refresh.
    await warmCollectionDashboard(queryClient);
  }

  await Promise.allSettled([
    prefetchCollection(queryClient),
    prefetchOwnedDecks(queryClient),
    prefetchWishlist(queryClient),
    prefetchCollectionShareStatus(queryClient),
  ]);

  // After network collection lands — insights + full list art + set banners.
  await warmCollectionDashboard(queryClient);
  await warmUserImages(queryClient);
  await writeLastCachedUserId(userId);
}

/**
 * Background warm-up for every main tab — never blocks AuthGate / splash.
 * Public: Play legends + Cards first-page details.
 * Signed-in: Wishlist prices, community deck browse.
 * (Collection dashboard is warmed in bootstrapUser so it feels already open.)
 */
export async function bootstrapDeferred(
  queryClient: QueryClient,
  options?: { signedIn?: boolean }
): Promise<void> {
  const tasks: Array<Promise<unknown>> = [
    prefetchPlayLegendCatalog(queryClient),
    warmSearchCardDetails(queryClient),
  ];

  if (options?.signedIn) {
    tasks.push(prefetchWishlistPrices(queryClient), prefetchDefaultDeckBrowse(queryClient));
  }

  await Promise.allSettled(tasks);

  if (options?.signedIn) {
    await warmUserImages(queryClient);
  }
}

/** Anonymous cold start through catalog; deferred runs in the background. */
export async function bootstrapAppColdStart(
  queryClient: QueryClient,
  options?: { onPhaseComplete?: PhaseListener }
): Promise<void> {
  const { onPhaseComplete } = options ?? {};
  await bootstrapLocal(queryClient);
  onPhaseComplete?.('local');
  await bootstrapCatalog(queryClient);
  onPhaseComplete?.('catalog');
  void bootstrapDeferred(queryClient).then(() => onPhaseComplete?.('deferred'));
}

export async function bootstrapSignedInUser(
  queryClient: QueryClient,
  options: { userId: string; onPhaseComplete?: PhaseListener }
): Promise<void> {
  const { userId, onPhaseComplete } = options;
  await bootstrapUser(queryClient, { userId });
  onPhaseComplete?.('user');
  // Tab payloads (wishlist prices, insights, browse) after the gate opens.
  void bootstrapDeferred(queryClient, { signedIn: true }).then(() =>
    onPhaseComplete?.('deferred')
  );
}
