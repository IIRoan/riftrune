import type { CardDetail, CardsListQuery } from '@riftbound/contracts';
import {
  CardDetailResponse,
  CardsBatchResponse,
  CardsListResponse,
  CatalogIndexResponse,
  DeckRulesResponse,
  DeckValidateInput,
  DeckValidateResponse,
  FiltersResponse,
  HealthResponse,
  PriceHistoryResponse,
  PricesListResponse,
} from '@riftbound/contracts';
import type { z } from 'zod';

const API_URL = String(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:7000');

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

  validateDeck: (deck: DeckValidateInput) =>
    apiFetch('/api/v1/deck-rules/validate', DeckValidateResponse, {
      method: 'POST',
      body: JSON.stringify(deck),
    }),

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
};

export type { CardDetail };
