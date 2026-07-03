import type { CollectionItem, WishlistItem } from '@riftbound/contracts';
import { CollectionListResponse, WishlistListResponse } from '@riftbound/contracts';
import { authClient } from '@/src/lib/auth-client';

const API_URL = String(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000');

const isBrowserRuntime = typeof document !== 'undefined';

async function authedFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string> }
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.body == null ? {} : { 'Content-Type': 'application/json' }),
    ...init?.headers,
  };
  const cookie = authClient.getCookie();
  if (!isBrowserRuntime && cookie) {
    headers.cookie = cookie;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method ?? 'GET',
    credentials: 'include',
    headers,
    body: init?.body == null ? undefined : JSON.stringify(init.body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API ${String(res.status)}: ${text}`);
  }

  return (text ? JSON.parse(text) : undefined) as T;
}

export async function fetchRemoteCollection(): Promise<CollectionItem[]> {
  const res = await authedFetch<{ data: CollectionItem[] }>('/v1/collection');
  return CollectionListResponse.parse(res).data;
}

export async function remoteAddToCollection(variantNumber: string, delta = 1): Promise<void> {
  await authedFetch(`/v1/collection/${encodeURIComponent(variantNumber)}/add`, {
    method: 'POST',
    body: { delta },
  });
}

export async function remoteRemoveFromCollection(
  variantNumber: string,
  delta = 1
): Promise<void> {
  await authedFetch(`/v1/collection/${encodeURIComponent(variantNumber)}/remove`, {
    method: 'POST',
    body: { delta },
  });
}

export async function remoteSetCollectionQuantity(
  variantNumber: string,
  quantity: number
): Promise<void> {
  await authedFetch(`/v1/collection/${encodeURIComponent(variantNumber)}`, {
    method: 'PUT',
    body: { variantNumber, quantity },
  });
}

export async function remoteDeleteFromCollection(variantNumber: string): Promise<void> {
  await authedFetch(`/v1/collection/${encodeURIComponent(variantNumber)}`, {
    method: 'DELETE',
  });
}

export async function remoteBatchSyncCollection(
  items: Array<{ variantNumber: string; quantity: number }>
): Promise<void> {
  await authedFetch('/v1/collection/batch', {
    method: 'POST',
    body: {
      items: items.map((item) => ({
        variantNumber: item.variantNumber,
        quantity: item.quantity,
        condition: 'near_mint',
        language: 'en',
      })),
    },
  });
}

export async function fetchRemoteWishlist(): Promise<WishlistItem[]> {
  const res = await authedFetch<{ data: WishlistItem[] }>('/v1/wishlist');
  return WishlistListResponse.parse(res).data;
}

export async function remoteAddToWishlist(variantNumber: string): Promise<void> {
  await authedFetch(`/v1/wishlist/${encodeURIComponent(variantNumber)}`, {
    method: 'PUT',
    body: { variantNumber },
  });
}

export async function remoteRemoveFromWishlist(variantNumber: string): Promise<void> {
  await authedFetch(`/v1/wishlist/${encodeURIComponent(variantNumber)}`, {
    method: 'DELETE',
  });
}
