import type { CollectionItem, WishlistItem } from '@riftbound/contracts';
import {
  CollectionImportResponse,
  CollectionListResponse,
  CollectionQuantitiesResponse,
  WishlistListResponse,
} from '@riftbound/contracts';
import { getAuthCookieHeader } from '@/lib/auth-cookie';
import { logActionFailure } from '@/lib/logger';

const API_URL = String(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:7000').replace(
  /\/$/,
  ''
);

const isBrowserRuntime = typeof document !== 'undefined';

export class RemoteApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly body: string
  ) {
    super(`API ${String(status)} ${path}: ${body}`);
    this.name = 'RemoteApiError';
  }
}

async function authedFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string> }
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.body == null ? {} : { 'Content-Type': 'application/json' }),
    ...init?.headers,
  };

  if (!isBrowserRuntime) {
    const cookie = getAuthCookieHeader();
    if (cookie) {
      headers.cookie = cookie;
    }
  }

  const method = init?.method ?? 'GET';

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: init?.body == null ? undefined : JSON.stringify(init.body),
    });
  } catch (error) {
    logActionFailure('api.fetch', error, { path, method });
    throw error;
  }

  const text = await res.text();
  if (!res.ok) {
    const apiError = new RemoteApiError(res.status, path, text);
    logActionFailure('api.request', apiError, {
      path,
      method,
      status: res.status,
      hasAuthCookie: Boolean(headers.cookie),
    });
    throw apiError;
  }

  try {
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (error) {
    logActionFailure('api.parse', error, { path, method });
    throw error;
  }
}

function parseOrThrow<T>(
  action: string,
  schema: { parse: (input: unknown) => T },
  input: unknown,
  context?: Record<string, unknown>
): T {
  try {
    return schema.parse(input);
  } catch (error) {
    logActionFailure(action, error, context);
    throw error;
  }
}

export async function fetchRemoteCollection(): Promise<CollectionItem[]> {
  const res = await authedFetch<{ data: CollectionItem[] }>('/api/v1/collection');
  return parseOrThrow('collection.list.parse', CollectionListResponse, res).data;
}

export async function fetchRemoteCollectionQuantities(
  variantNumbers: string[]
): Promise<Array<{ variantNumber: string; quantity: number }>> {
  if (variantNumbers.length === 0) return [];
  const res = await authedFetch<{ data: Array<{ variantNumber: string; quantity: number }> }>(
    '/api/v1/collection/quantities',
    {
      method: 'POST',
      body: { variantNumbers },
    }
  );
  return parseOrThrow('collection.quantities.parse', CollectionQuantitiesResponse, res).data;
}

export async function remoteAddToCollection(
  variantNumber: string,
  delta = 1
): Promise<void> {
  await authedFetch(`/api/v1/collection/${encodeURIComponent(variantNumber)}/add`, {
    method: 'POST',
    body: { delta },
  });
}

export async function remoteRemoveFromCollection(
  variantNumber: string,
  delta = 1
): Promise<void> {
  await authedFetch(`/api/v1/collection/${encodeURIComponent(variantNumber)}/remove`, {
    method: 'POST',
    body: { delta },
  });
}

export async function remoteSetCollectionQuantity(
  variantNumber: string,
  quantity: number
): Promise<void> {
  await authedFetch(`/api/v1/collection/${encodeURIComponent(variantNumber)}`, {
    method: 'PUT',
    body: { variantNumber, quantity },
  });
}

export async function remoteDeleteFromCollection(variantNumber: string): Promise<void> {
  await authedFetch(`/api/v1/collection/${encodeURIComponent(variantNumber)}`, {
    method: 'DELETE',
  });
}

export async function remoteBatchSyncCollection(
  items: Array<{ variantNumber: string; quantity: number }>
): Promise<void> {
  await authedFetch('/api/v1/collection/batch', {
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

export async function remoteExportCollectionCsv(): Promise<string> {
  const headers: Record<string, string> = { Accept: 'text/csv' };
  if (!isBrowserRuntime) {
    const cookie = getAuthCookieHeader();
    if (cookie) {
      headers.cookie = cookie;
    }
  }

  const path = '/api/v1/collection/export';
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });
  } catch (error) {
    logActionFailure('collection.export.fetch', error, { path });
    throw error;
  }

  const text = await res.text();
  if (!res.ok) {
    const apiError = new RemoteApiError(res.status, path, text);
    logActionFailure('collection.export', apiError, { status: res.status });
    throw apiError;
  }
  return text;
}

export async function remoteImportCollectionItems(
  items: Array<{
    variantNumber: string;
    quantity: number;
    condition?: string;
    language?: string;
    notes?: string | null;
    isGraded?: boolean;
    gradeCompany?: string | null;
    gradeScore?: string | null;
  }>
): Promise<{
  imported: number;
  totalCopies: number;
  failedRows: number;
  errors: Array<{ row: number; message: string }>;
}> {
  const res = await authedFetch<{ data: unknown }>('/api/v1/collection/import', {
    method: 'POST',
    body: { items },
  });
  const parsed = parseOrThrow('collection.import.parse', CollectionImportResponse, res).data;
  return {
    imported: parsed.imported,
    totalCopies: parsed.totalCopies,
    failedRows: parsed.failedRows,
    errors: parsed.errors,
  };
}

export async function remoteClearCollection(): Promise<void> {
  await authedFetch('/api/v1/collection/all', {
    method: 'DELETE',
  });
}

export async function fetchRemoteWishlist(): Promise<WishlistItem[]> {
  const res = await authedFetch<{ data: WishlistItem[] }>('/api/v1/wishlist');
  return parseOrThrow('wishlist.list.parse', WishlistListResponse, res).data;
}

export async function remoteAddToWishlist(variantNumber: string): Promise<void> {
  await authedFetch(`/api/v1/wishlist/${encodeURIComponent(variantNumber)}`, {
    method: 'PUT',
    body: { variantNumber },
  });
}

export async function remoteRemoveFromWishlist(variantNumber: string): Promise<void> {
  await authedFetch(`/api/v1/wishlist/${encodeURIComponent(variantNumber)}`, {
    method: 'DELETE',
  });
}
