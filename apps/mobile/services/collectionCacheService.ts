import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CollectionEntry } from '@/services/collectionService';

const COLLECTION_CACHE_KEY = 'riftbound_collection_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type PersistedCollection = {
  cachedAt: number;
  entries: CollectionEntry[];
};

export async function readPersistedCollection(): Promise<CollectionEntry[] | null> {
  try {
    const raw = await AsyncStorage.getItem(COLLECTION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedCollection;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(COLLECTION_CACHE_KEY);
      return null;
    }
    return parsed.entries;
  } catch {
    return null;
  }
}

export async function persistCollection(entries: CollectionEntry[]): Promise<void> {
  try {
    const payload: PersistedCollection = {
      cachedAt: Date.now(),
      entries,
    };
    await AsyncStorage.setItem(COLLECTION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Best-effort cache; ignore write failures.
  }
}

export async function clearPersistedCollection(): Promise<void> {
  try {
    await AsyncStorage.removeItem(COLLECTION_CACHE_KEY);
  } catch {
    // Ignore.
  }
}
