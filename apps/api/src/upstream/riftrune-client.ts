import {
  PaCardsBatchResponse,
  PaCardsListResponse,
  PaLogicalCard,
  PaPricesListResponse,
  type PaVariantListItem,
  type PaPriceRow,
} from '@riftbound/contracts';
import type { Env } from '../env.js';

export class RiftruneApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string
  ) {
    super(message);
    this.name = 'RiftruneApiError';
  }
}

export class RiftruneClient {
  constructor(private readonly env: Env) {}

  private async request<T>(
    path: string,
    init?: RequestInit & { parse?: (data: unknown) => T }
  ): Promise<T> {
    const { parse, method, body } = init ?? {};
    const url = `${this.env.RIFTRUNE_BASE_URL}${path}`;
    const fetchInit: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.env.RIFTRUNE_API_KEY,
      },
      signal: AbortSignal.timeout(30_000),
    };
    if (method) fetchInit.method = method;
    if (body !== undefined) fetchInit.body = body;

    const res = await fetch(url, fetchInit);

    if (!res.ok) {
      const text = await res.text();
      throw new RiftruneApiError(
        `Riftrune API ${String(res.status)}: ${path}`,
        res.status,
        text
      );
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const data: unknown = await res.json();
    if (parse) {
      return parse(data);
    }
    return data as T;
  }

  getCard(variantNumber: string): Promise<PaLogicalCard> {
    return this.request(`/v1/cards/${encodeURIComponent(variantNumber)}`, {
      parse: (d) => PaLogicalCard.parse(d),
    });
  }

  listCards(
    params: Record<string, string | number | undefined>
  ): Promise<PaCardsListResponse> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    }
    const q = qs.toString();
    return this.request(`/v1/cards${q ? `?${q}` : ''}`, {
      parse: (d) => PaCardsListResponse.parse(d),
    });
  }

  batchCards(
    variantNumbers: string[]
  ): Promise<{ data: PaVariantListItem[]; notFound: string[] }> {
    return this.request('/v1/cards/batch', {
      method: 'POST',
      body: JSON.stringify({ variantNumbers }),
      parse: (d) => PaCardsBatchResponse.parse(d),
    });
  }

  getAllPrices(): Promise<PaPriceRow[]> {
    return this.request('/v1/prices', {
      parse: (d) => PaPricesListResponse.parse(d).data,
    });
  }
}
