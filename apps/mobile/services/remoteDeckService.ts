import {
  DeckDetailResponse,
  DeckListResponse,
  type DeckListItem,
  type DecksListQuery,
  type StoredDeckPayload,
} from '@riftbound/contracts';

type DeckListPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious?: boolean;
};
import { getAuthCookieHeader } from '@/lib/auth-cookie';
import { logActionFailure } from '@/lib/logger';

const API_URL = String(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:7000').replace(
  /\/$/,
  ''
);

const isBrowserRuntime = typeof document !== 'undefined';

export class RemoteDeckApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly body: string
  ) {
    super(`API ${String(status)} ${path}: ${body}`);
    this.name = 'RemoteDeckApiError';
  }
}

async function authedFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.body == null ? {} : { 'Content-Type': 'application/json' }),
  };

  if (!isBrowserRuntime) {
    const cookie = getAuthCookieHeader();
    if (cookie) headers.cookie = cookie;
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
    logActionFailure('decks.fetch', error, { path, method });
    throw error;
  }

  const text = await res.text();
  if (!res.ok) {
    throw new RemoteDeckApiError(res.status, path, text);
  }

  return (text ? JSON.parse(text) : undefined) as T;
}

export async function fetchRemoteDecks(
  options?: Partial<DecksListQuery>
): Promise<{ data: DeckListItem[]; pagination?: DeckListPagination }> {
  const params = new URLSearchParams();
  if (options?.q?.trim()) params.set('q', options.q.trim());
  if (options?.legend?.trim()) params.set('legend', options.legend.trim());
  if (options?.sets?.trim()) params.set('sets', options.sets.trim());
  if (options?.isLegal !== undefined) params.set('isLegal', String(options.isLegal));
  if (options?.hasGuide === true) params.set('hasGuide', 'true');
  if (options?.hasVideo === true) params.set('hasVideo', 'true');
  if (options?.hasMatchups === true) params.set('hasMatchups', 'true');
  if (options?.page !== undefined) params.set('page', String(options.page));
  if (options?.limit !== undefined) params.set('limit', String(options.limit));
  if (options?.sort) params.set('sort', options.sort);
  if (options?.dir) params.set('dir', options.dir);
  if (options?.source && options.source !== 'all') params.set('source', options.source);
  if (options?.preview === true) params.set('preview', 'true');
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await authedFetch<unknown>(`/api/v1/decks${qs}`);
  const parsed = DeckListResponse.parse(res);
  return { data: parsed.data, pagination: parsed.meta.pagination };
}

export async function fetchRemoteDeck(deckId: string): Promise<DeckListItem | null> {
  try {
    const res = await authedFetch<unknown>(`/api/v1/decks/${encodeURIComponent(deckId)}`);
    return DeckDetailResponse.parse(res).data;
  } catch (error) {
    if (error instanceof RemoteDeckApiError && error.status === 404) return null;
    throw error;
  }
}

export async function remoteUpsertDeck(deck: StoredDeckPayload): Promise<DeckListItem> {
  const res = await authedFetch<unknown>(`/api/v1/decks/${encodeURIComponent(deck.id)}`, {
    method: 'PUT',
    body: deck,
  });
  return DeckDetailResponse.parse(res).data;
}

export async function remoteImportDeck(deckId: string): Promise<DeckListItem> {
  const res = await authedFetch<unknown>(`/api/v1/decks/${encodeURIComponent(deckId)}/import`, {
    method: 'POST',
  });
  return DeckDetailResponse.parse(res).data;
}

export async function remoteDeleteDeck(deckId: string): Promise<void> {
  await authedFetch(`/api/v1/decks/${encodeURIComponent(deckId)}`, {
    method: 'DELETE',
  });
}

export function isRemoteDeckAuthError(error: unknown): boolean {
  return error instanceof RemoteDeckApiError && error.status === 401;
}

export function isRemoteDeckReadOnlyError(error: unknown): boolean {
  return error instanceof RemoteDeckApiError && error.status === 403;
}
