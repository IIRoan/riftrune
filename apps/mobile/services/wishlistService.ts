import {
  fetchRemoteWishlist,
  remoteAddToWishlist,
  remoteRemoveFromWishlist,
} from '@/services/remoteCollectionService';

export type WishlistEntry = {
  variantNumber: string;
  name: string;
  imageUrl?: string;
  addedAt: number;
};

export async function getWishlist(): Promise<WishlistEntry[]> {
  const items = await fetchRemoteWishlist();
  return items.map((item) => ({
    variantNumber: item.variantNumber,
    name: item.name,
    imageUrl: item.imageUrl,
    addedAt: new Date(item.addedAt).getTime(),
  }));
}

export async function addToWishlist(entry: Omit<WishlistEntry, 'addedAt'>): Promise<void> {
  await remoteAddToWishlist(entry.variantNumber);
}

export async function removeFromWishlist(variantNumber: string): Promise<void> {
  await remoteRemoveFromWishlist(variantNumber);
}

export async function isOnWishlist(variantNumber: string): Promise<boolean> {
  const items = await getWishlist();
  return items.some((i) => i.variantNumber === variantNumber);
}
