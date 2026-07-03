import AsyncStorage from '@react-native-async-storage/async-storage';

const WISHLIST_KEY = 'riftbound_wishlist';

export type WishlistEntry = {
  variantNumber: string;
  name: string;
  imageUrl?: string;
  addedAt: number;
};

export async function getWishlist(): Promise<WishlistEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WishlistEntry[];
  } catch {
    return [];
  }
}

export async function addToWishlist(entry: Omit<WishlistEntry, 'addedAt'>): Promise<void> {
  const items = await getWishlist();
  if (items.some((i) => i.variantNumber === entry.variantNumber)) return;
  await AsyncStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify([{ ...entry, addedAt: Date.now() }, ...items])
  );
}

export async function removeFromWishlist(variantNumber: string): Promise<void> {
  const items = await getWishlist();
  await AsyncStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify(items.filter((i) => i.variantNumber !== variantNumber))
  );
}

export async function isOnWishlist(variantNumber: string): Promise<boolean> {
  const items = await getWishlist();
  return items.some((i) => i.variantNumber === variantNumber);
}
