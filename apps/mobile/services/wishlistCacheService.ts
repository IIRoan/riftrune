import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WishlistEntry } from '@/services/wishlistService';

const WISHLIST_CACHE_KEY = 'riftbound_wishlist_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type PersistedWishlist = {
  cachedAt: number;
  entries: WishlistEntry[];
};

export async function readPersistedWishlist(): Promise<WishlistEntry[] | null> {
  try {
    const raw = await AsyncStorage.getItem(WISHLIST_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedWishlist;
    if (!Array.isArray(parsed.entries)) return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(WISHLIST_CACHE_KEY);
      return null;
    }
    return parsed.entries;
  } catch {
    return null;
  }
}

export async function persistWishlist(entries: WishlistEntry[]): Promise<void> {
  try {
    const payload: PersistedWishlist = {
      cachedAt: Date.now(),
      entries,
    };
    await AsyncStorage.setItem(WISHLIST_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Best-effort cache; ignore write failures.
  }
}

export async function clearPersistedWishlist(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WISHLIST_CACHE_KEY);
  } catch {
    // Ignore.
  }
}
