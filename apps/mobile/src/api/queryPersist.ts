import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Query } from '@tanstack/react-query';
import type { Persister } from '@tanstack/react-query-persist-client';
import {
  catalogQueryKeys,
  collectionQueryKeys,
  wishlistQueryKeys,
} from '@/src/api/queryKeys';

export const QUERY_PERSIST_KEY = 'astral-grove-react-query-v1';
/** Keep restored queries warm for a full day. */
export const QUERY_PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const PERSISTABLE_ROOTS = new Set<string>([
  catalogQueryKeys.meta[0],
  catalogQueryKeys.filters[0],
  collectionQueryKeys.all[0],
  wishlistQueryKeys.all[0],
]);

/** Persist JSON-safe high-value caches only — skip catalog index, decks Maps, infinite pages, card-detail floods. */
export function shouldPersistQuery(query: Pick<Query, 'queryKey' | 'state'>): boolean {
  if (query.state.status !== 'success') return false;
  const root = query.queryKey[0];
  if (typeof root !== 'string' || !PERSISTABLE_ROOTS.has(root)) return false;
  // Catalog index is persisted by catalogIndexService — avoid doubling disk.
  if (root === 'catalog' && query.queryKey[1] === 'index') return false;
  if (root === 'collection' && query.queryKey[1] === 'recent-adds') return false;
  // Price history charts can be large; list membership is enough at boot.
  if (root === 'wishlist' && query.queryKey[1] === 'prices') return false;
  return true;
}

export function createQueryPersister(): Persister {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: QUERY_PERSIST_KEY,
    throttleTime: 2_000,
  });
}

/** Drop the persisted QueryClient blob (sign-out / account switch). */
export async function clearPersistedQueryClient(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUERY_PERSIST_KEY);
  } catch {
    // Ignore.
  }
}
