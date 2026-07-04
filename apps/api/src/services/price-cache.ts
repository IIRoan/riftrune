import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import type { PaPriceRow, PriceRow } from '@riftbound/contracts';
import type { Database } from '../db/client.js';
import { priceHistory, prices, syncState } from '../db/schema.js';
import { pricesFingerprint } from '../lib/hash.js';
import type { RiftruneClient } from '../upstream/riftrune-client.js';
import { paPriceHash } from './card-mapper.js';

function parseNum(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  return value;
}

function toPriceRow(row: typeof prices.$inferSelect): PriceRow {
  const num = (v: string | null) => (v === null ? null : Number(v));
  return {
    id: row.id,
    cardmarketId: row.cardmarketId,
    isFoil: row.isFoil,
    provider: 'cardmarket',
    currency: 'EUR',
    lowPrice: num(row.lowPrice),
    marketPrice: num(row.marketPrice),
    midPrice: num(row.midPrice),
    highPrice: num(row.highPrice),
    avg1Day: num(row.avg1Day),
    avg7Day: num(row.avg7Day),
    avg30Day: num(row.avg30Day),
    lastUpdated: row.upstreamLastUpdated.toISOString(),
  };
}

function toHistoryRow(row: typeof priceHistory.$inferSelect) {
  const num = (v: string | null) => (v === null ? null : Number(v));
  return {
    cardmarketId: row.cardmarketId,
    isFoil: row.isFoil,
    provider: 'cardmarket' as const,
    currency: 'EUR' as const,
    lowPrice: num(row.lowPrice),
    marketPrice: num(row.marketPrice),
    midPrice: num(row.midPrice),
    highPrice: num(row.highPrice),
    avg1Day: num(row.avg1Day),
    avg7Day: num(row.avg7Day),
    avg30Day: num(row.avg30Day),
    lastUpdated: row.upstreamLastUpdated.toISOString(),
    capturedAt: row.capturedAt.toISOString(),
  };
}

export class PriceCacheService {
  constructor(
    private readonly db: Database,
    private readonly riftrune: RiftruneClient
  ) {}

  /** Fetch only prices for the cardmarket IDs in the current result page (fast path). */
  async getRowsForCardmarketIds(cardmarketIds: number[]): Promise<PaPriceRow[]> {
    const unique = [...new Set(cardmarketIds)];
    if (unique.length === 0) return [];

    const rows = await this.db
      .select()
      .from(prices)
      .where(inArray(prices.cardmarketId, unique));

    return rows.map((r) => ({
      id: r.id,
      cardmarketId: r.cardmarketId,
      tcgPlayerId: null,
      provider: r.provider,
      isFoil: r.isFoil,
      currency: r.currency,
      lowPrice: r.lowPrice,
      marketPrice: r.marketPrice,
      midPrice: r.midPrice,
      highPrice: r.highPrice,
      directLowPrice: null,
      avg1Day: r.avg1Day,
      avg7Day: r.avg7Day,
      avg30Day: r.avg30Day,
      lastUpdated: r.upstreamLastUpdated.toISOString(),
    }));
  }

  async list(filters?: {
    cardmarketId?: number;
    isFoil?: boolean;
  }): Promise<{ rows: PriceRow[]; catalogHash: string; lastSyncedAt: string | null }> {
    const conditions = [];
    if (filters?.cardmarketId !== undefined) {
      conditions.push(eq(prices.cardmarketId, filters.cardmarketId));
    }
    if (filters?.isFoil !== undefined) {
      conditions.push(eq(prices.isFoil, filters.isFoil));
    }

    const rows =
      conditions.length > 0
        ? await this.db
            .select()
            .from(prices)
            .where(and(...conditions))
        : await this.db.select().from(prices);

    const sync = await this.db.query.syncState.findFirst({
      where: eq(syncState.key, 'prices'),
    });

    return {
      rows: rows.map(toPriceRow),
      catalogHash: sync?.contentHash ?? '',
      lastSyncedAt: sync?.lastSuccessAt?.toISOString() ?? null,
    };
  }

  async history(filters: {
    cardmarketId: number;
    isFoil?: boolean;
    days: number;
  }): Promise<{ rows: ReturnType<typeof toHistoryRow>[] }> {
    const since = new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000);
    const conditions = [
      eq(priceHistory.cardmarketId, filters.cardmarketId),
      gte(priceHistory.capturedAt, since),
    ];

    if (filters.isFoil !== undefined) {
      conditions.push(eq(priceHistory.isFoil, filters.isFoil));
    }

    const rows = await this.db
      .select()
      .from(priceHistory)
      .where(and(...conditions))
      .orderBy(desc(priceHistory.capturedAt));

    return { rows: rows.map(toHistoryRow).reverse() };
  }

  async syncFromUpstream(): Promise<{
    changed: boolean;
    rowCount: number;
    hash: string;
  }> {
    const upstream = await this.riftrune.getAllPrices();
    const hash = pricesFingerprint(
      upstream.map((r) => ({
        cardmarketId: r.cardmarketId,
        isFoil: r.isFoil,
        lastUpdated: r.lastUpdated,
        marketPrice: r.marketPrice,
      }))
    );

    const existing = await this.db.query.syncState.findFirst({
      where: eq(syncState.key, 'prices'),
    });

    const now = new Date();

    if (existing?.contentHash === hash) {
      await this.db.transaction(async (tx) => {
        for (const row of upstream) {
          await tx
            .insert(priceHistory)
            .values({
              cardmarketId: row.cardmarketId,
              isFoil: row.isFoil,
              provider: row.provider,
              currency: row.currency,
              lowPrice: parseNum(row.lowPrice),
              marketPrice: parseNum(row.marketPrice),
              midPrice: parseNum(row.midPrice),
              highPrice: parseNum(row.highPrice),
              avg1Day: parseNum(row.avg1Day),
              avg7Day: parseNum(row.avg7Day),
              avg30Day: parseNum(row.avg30Day),
              upstreamLastUpdated: new Date(row.lastUpdated),
              contentHash: paPriceHash(row),
              capturedAt: now,
            })
            .onConflictDoNothing();
        }
      });

      return { changed: false, rowCount: upstream.length, hash };
    }

    await this.db.transaction(async (tx) => {
      for (const row of upstream) {
        const rowHash = paPriceHash(row);
        await tx
          .insert(priceHistory)
          .values({
            cardmarketId: row.cardmarketId,
            isFoil: row.isFoil,
            provider: row.provider,
            currency: row.currency,
            lowPrice: parseNum(row.lowPrice),
            marketPrice: parseNum(row.marketPrice),
            midPrice: parseNum(row.midPrice),
            highPrice: parseNum(row.highPrice),
            avg1Day: parseNum(row.avg1Day),
            avg7Day: parseNum(row.avg7Day),
            avg30Day: parseNum(row.avg30Day),
            upstreamLastUpdated: new Date(row.lastUpdated),
            contentHash: rowHash,
            capturedAt: now,
          })
          .onConflictDoNothing();

        await tx
          .insert(prices)
          .values({
            id: row.id,
            cardmarketId: row.cardmarketId,
            isFoil: row.isFoil,
            provider: row.provider,
            currency: row.currency,
            lowPrice: parseNum(row.lowPrice),
            marketPrice: parseNum(row.marketPrice),
            midPrice: parseNum(row.midPrice),
            highPrice: parseNum(row.highPrice),
            avg1Day: parseNum(row.avg1Day),
            avg7Day: parseNum(row.avg7Day),
            avg30Day: parseNum(row.avg30Day),
            upstreamLastUpdated: new Date(row.lastUpdated),
            contentHash: rowHash,
            fetchedAt: now,
          })
          .onConflictDoUpdate({
            target: prices.id,
            set: {
              lowPrice: parseNum(row.lowPrice),
              marketPrice: parseNum(row.marketPrice),
              midPrice: parseNum(row.midPrice),
              avg1Day: parseNum(row.avg1Day),
              avg7Day: parseNum(row.avg7Day),
              avg30Day: parseNum(row.avg30Day),
              upstreamLastUpdated: new Date(row.lastUpdated),
              contentHash: rowHash,
              fetchedAt: now,
            },
          });
      }

      await tx
        .insert(syncState)
        .values({
          key: 'prices',
          contentHash: hash,
          rowCount: upstream.length,
          lastSuccessAt: now,
          lastAttemptAt: now,
          status: 'idle',
          lastError: null,
        })
        .onConflictDoUpdate({
          target: syncState.key,
          set: {
            contentHash: hash,
            rowCount: upstream.length,
            lastSuccessAt: now,
            lastAttemptAt: now,
            status: 'idle',
            lastError: null,
          },
        });
    });

    return { changed: true, rowCount: upstream.length, hash };
  }
}
