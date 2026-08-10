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

/** First viewports of Cards tab art / details. */
const CATALOG_IMAGE_WARM_COUNT = 80;
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
 * Disk + auth-critical bundled assets — no network required.
 * Hold the splash until this finishes. Collection set banners warm later
 * (warmCollectionDashboard) so they do not block first paint.
 */
export async function bootstrapLocal(queryClient: QueryClient): Promise<void> {
  await Promise.all([hydrateCatalogIndex(queryClient), preloadCriticalLocalAssets()]);
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
 * Disk hydrate / account-switch reset only — enough for AuthGate to open.
 * Same user: seed query cache from disk so tabs paint immediately.
 * Different user: clear prior caches (network refresh follows in background).
 */
export async function hydrateSignedInUser(
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
  }

  // Stamp scope before background refresh so a mid-refresh kill still scopes correctly.
  await writeLastCachedUserId(userId);
}

/**
 * Network refresh + image/detail warm for signed-in tabs.
 * Never await this on the AuthGate path — run after hydrateSignedInUser.
 */
export async function refreshSignedInUser(
  queryClient: QueryClient,
  options: { userId: string }
): Promise<void> {
  const { userId } = options;

  await Promise.allSettled([
    prefetchCollection(queryClient),
    prefetchOwnedDecks(queryClient),
    prefetchWishlist(queryClient),
    prefetchCollectionShareStatus(queryClient),
  ]);

  await warmCollectionDashboard(queryClient);
  await warmUserImages(queryClient);
  await writeLastCachedUserId(userId);
}

/**
 * Full signed-in bootstrap (hydrate + refresh). Prefer hydrateSignedInUser +
 * background refreshSignedInUser on the AuthGate path.
 */
export async function bootstrapUser(
  queryClient: QueryClient,
  options: { userId: string }
): Promise<void> {
  await hydrateSignedInUser(queryClient, options);
  await refreshSignedInUser(queryClient, options);
}

/**
 * Background warm-up for every main tab — never blocks AuthGate / splash.
 * Public: Play legends + Cards first-page details.
 * Signed-in: Wishlist prices, community deck browse.
 * Collection dashboard art is warmed in refreshSignedInUser after hydrate.
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

/**
 * Open AuthGate as soon as disk caches are hydrated; refresh + tab warm-up
 * continue in the background so splash/gate are not blocked on images/network.
 */
export async function bootstrapSignedInUser(
  queryClient: QueryClient,
  options: { userId: string; onPhaseComplete?: PhaseListener }
): Promise<void> {
  const { userId, onPhaseComplete } = options;
  await hydrateSignedInUser(queryClient, { userId });
  onPhaseComplete?.('user');
  void (async () => {
    try {
      await refreshSignedInUser(queryClient, { userId });
    } catch {
      // Best-effort — screens still fetch on demand.
    }
    await bootstrapDeferred(queryClient, { signedIn: true });
    onPhaseComplete?.('deferred');
  })();
}
