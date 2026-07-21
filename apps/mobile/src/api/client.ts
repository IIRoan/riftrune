import type { CardDetail, CardsListQuery, PriceStatsBatchRequest } from '@riftbound/contracts';
import {
  CardDetailResponse,
  CardsBatchResponse,
  CardsListResponse,
  CatalogIndexResponse,
  DeckRulesResponse,
  FiltersResponse,
  HealthResponse,
  PriceHistoryResponse,
  PriceStatsBatchResponse,
  PricesListResponse,
} from '@riftbound/contracts';
import type { z } from 'zod';
import { getApiUrl } from '@/lib/api-url';

// Unauthenticated JSON client for catalog, prices, and filters.
// User data (collection, decks) goes through authedClient.ts instead.

const API_URL = getApiUrl();

export class ApiError extends Error {
  constructor(
    readonly status: number,
    body: string
  ) {
    super(`API ${String(status)}: ${body}`);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: Pick<RequestInit, 'method' | 'body'>
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method,
    body: init?.body,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  const json: unknown = await res.json();
  return schema.parse(json);
}

export const api = {
  health: () => apiFetch('/api/v1/health', HealthResponse),

  listCards: (query: Partial<CardsListQuery>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query) as [
      keyof CardsListQuery,
      CardsListQuery[keyof CardsListQuery],
    ][]) {
      if (v === undefined || v === null || v === '') continue;
      params.set(k, String(v));
    }
    const qs = params.toString();
    return apiFetch(`/api/v1/cards${qs ? `?${qs}` : ''}`, CardsListResponse);
  },

  getCatalogIndex: () => apiFetch('/api/v1/cards/index', CatalogIndexResponse),

  getCard: (variantNumber: string) =>
    apiFetch(`/api/v1/cards/${encodeURIComponent(variantNumber)}`, CardDetailResponse),

  batchCards: (variantNumbers: string[]) =>
    apiFetch('/api/v1/cards/batch', CardsBatchResponse, {
      method: 'POST',
      body: JSON.stringify({ variantNumbers }),
    }),

  getFilters: () => apiFetch('/api/v1/filters', FiltersResponse),

  getDeckRules: () => apiFetch('/api/v1/deck-rules', DeckRulesResponse),

  getPrices: (query: {
    cardmarketId?: number;
    variantNumber?: string;
    isFoil?: boolean;
  }) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) params.set(k, String(v));
    }
    const qs = params.toString();
    return apiFetch(`/api/v1/prices${qs ? `?${qs}` : ''}`, PricesListResponse);
  },

  getPriceHistory: (query: {
    cardmarketId?: number;
    variantNumber?: string;
    isFoil?: boolean;
    days?: number;
  }) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) params.set(k, String(v));
    }
    const qs = params.toString();
    return apiFetch(
      `/api/v1/prices/history${qs ? `?${qs}` : ''}`,
      PriceHistoryResponse
    );
  },

  getPriceStatsBatch: (body: PriceStatsBatchRequest) =>
    apiFetch('/api/v1/prices/stats/batch', PriceStatsBatchResponse, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export type { CardDetail };
