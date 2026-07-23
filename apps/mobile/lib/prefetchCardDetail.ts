import { Image } from 'expo-image';
import type { QueryClient } from '@tanstack/react-query';
import type { CardDetail, CardListItem } from '@riftbound/contracts';
import { chunkArray } from '@riftbound/contracts';
import { markSessionImageLoaded } from '@/lib/imageSessionCache';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

const DETAIL_STALE_MS = 5 * 60 * 1000;
/** Coalesce bursts from list mount + viewability into one batch POST. */
const BATCH_FLUSH_MS = 16;
const MAX_BATCH = 100;

type CardDetailCacheEntry = {
  data: CardDetail;
  meta: {
    source: 'cache' | 'upstream' | 'cache-refreshed';
    contentHash: string;
  };
};

type PendingPrefetch = {
  queryClient: QueryClient;
  variantNumbers: Set<string>;
  timer: ReturnType<typeof setTimeout> | null;
};

let pending: PendingPrefetch | null = null;
let flushChain: Promise<void> = Promise.resolve();

function prefetchCardImage(item: CardListItem): void {
  const imageUri = resolveImageUrl(item.imageUrl);
  if (!imageUri) return;
  void Image.prefetch(imageUri).then((ok) => {
    if (ok) markSessionImageLoaded(imageUri);
  });
}

function needsDetailPrefetch(
  queryClient: QueryClient,
  variantNumber: string,
  options?: { ignoreInFlight?: boolean }
): boolean {
  const state = queryClient.getQueryState<CardDetailCacheEntry>(
    cardQueryKeys.detail(variantNumber)
  );
  if (!state) return true;
  if (!options?.ignoreInFlight && state.fetchStatus === 'fetching') return false;
  if (state.data && !state.isInvalidated) {
    return Date.now() - state.dataUpdatedAt >= DETAIL_STALE_MS;
  }
  return true;
}

function seedDetailCache(
  queryClient: QueryClient,
  variantNumber: string,
  card: CardDetail,
  source: CardDetailCacheEntry['meta']['source']
): void {
  const key = cardQueryKeys.detail(variantNumber);
  const existing = queryClient.getQueryState<CardDetailCacheEntry>(key);
  if (existing?.data && !existing.isInvalidated) {
    if (Date.now() - existing.dataUpdatedAt < DETAIL_STALE_MS) return;
  }

  const payload: CardDetailCacheEntry = {
    data: card,
    meta: { source, contentHash: 'batch-prefetch' },
  };
  queryClient.setQueryData(key, payload);
}

function mapBatchSource(
  source: 'cache' | 'mixed' | 'upstream'
): CardDetailCacheEntry['meta']['source'] {
  if (source === 'upstream') return 'upstream';
  return 'cache';
}

async function runBatchPrefetch(
  queryClient: QueryClient,
  variantNumbers: string[]
): Promise<void> {
  const missing = variantNumbers.filter((variantNumber) =>
    // Include variants whose detail query already started — caller may be
    // waiting on this flush before falling back to a one-off GET.
    needsDetailPrefetch(queryClient, variantNumber, { ignoreInFlight: true })
  );
  if (missing.length === 0) return;

  for (const batch of chunkArray(missing, MAX_BATCH)) {
    const requested = new Set(batch);
    const response = await api.batchCards(batch);
    const source = mapBatchSource(response.meta.source);

    for (const card of response.data) {
      const hit = card.variants.some((variant) => requested.has(variant.variantNumber));
      if (!hit) continue;
      // Seed every printing on cards we paid for — printing switches stay warm.
      for (const variant of card.variants) {
        seedDetailCache(queryClient, variant.variantNumber, card, source);
      }
    }
  }
}

function scheduleFlush(queryClient: QueryClient): void {
  if (!pending) {
    pending = { queryClient, variantNumbers: new Set(), timer: null };
  } else {
    pending.queryClient = queryClient;
  }

  if (pending.timer != null) return;

  pending.timer = setTimeout(() => {
    const snapshot = pending;
    pending = null;
    if (!snapshot || snapshot.variantNumbers.size === 0) return;

    const variants = [...snapshot.variantNumbers];
    flushChain = flushChain
      .then(() => runBatchPrefetch(snapshot.queryClient, variants))
      .catch(() => {
        // Prefetch is best-effort; detail views still fetch on demand.
      });
  }, BATCH_FLUSH_MS);
}

/** Warm the detail query and image cache for a catalog list row. */
export function prefetchCardDetail(queryClient: QueryClient, item: CardListItem): void {
  prefetchCardImage(item);

  const { variantNumber } = item;
  if (!variantNumber || !needsDetailPrefetch(queryClient, variantNumber)) return;

  scheduleFlush(queryClient);
  pending?.variantNumbers.add(variantNumber);
}

/** Flush any queued detail prefetches (tests / urgent select paths). */
export async function flushCardDetailPrefetch(): Promise<void> {
  if (pending?.timer != null) {
    clearTimeout(pending.timer);
    pending.timer = null;
  }

  const snapshot = pending;
  pending = null;
  if (snapshot && snapshot.variantNumbers.size > 0) {
    flushChain = flushChain
      .then(() => runBatchPrefetch(snapshot.queryClient, [...snapshot.variantNumbers]))
      .catch(() => undefined);
  }

  await flushChain;
}

/** Test helper — clears the in-flight coalesce queue. */
export function resetCardDetailPrefetchQueue(): void {
  if (pending?.timer != null) {
    clearTimeout(pending.timer);
  }
  pending = null;
  flushChain = Promise.resolve();
}
