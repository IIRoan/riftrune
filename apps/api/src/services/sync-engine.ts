import { eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { filterSnapshots, syncState } from '../db/schema.js';
import { catalogFingerprint, entityHash } from '../lib/hash.js';
import type { RiftruneClient } from '../upstream/riftrune-client.js';
import type { CardCacheService } from './card-cache.js';

export class SyncEngine {
  constructor(
    private readonly db: Database,
    private readonly riftrune: RiftruneClient,
    private readonly cards: CardCacheService
  ) {}

  async syncCatalog(): Promise<{
    changed: boolean;
    pages: number;
    variantCount: number;
    hash: string;
  }> {
    const now = new Date();
    await this.setSyncStatus('catalog', 'running');

    try {
      const probe = await this.riftrune.listCards({ limit: 1, page: 1 });
      const fingerprint = catalogFingerprint(
        probe.pagination.total,
        probe.meta?.filters ?? {}
      );

      const existing = await this.db.query.syncState.findFirst({
        where: eq(syncState.key, 'catalog'),
      });

      if (existing?.contentHash === fingerprint && (existing.rowCount ?? 0) > 0) {
        await this.setSyncStatus('catalog', 'idle', {
          contentHash: fingerprint,
          rowCount: existing.rowCount ?? 0,
          lastSuccessAt: existing.lastSuccessAt ?? now,
        });
        return {
          changed: false,
          pages: 0,
          variantCount: existing.rowCount ?? 0,
          hash: fingerprint,
        };
      }

      if (probe.meta?.filters) {
        const filterHash = entityHash(probe.meta.filters);
        await this.db.insert(filterSnapshots).values({
          snapshot: probe.meta.filters,
          contentHash: filterHash,
        });
      }

      let page = 1;
      let pages = 0;
      const limit = 100;
      let hasMore = true;
      const maxPages = Number(process.env.SYNC_MAX_PAGES ?? 0) || Infinity;
      const syncedCardIds = new Set<string>();

      while (hasMore) {
        const res = await this.riftrune.listCards({ limit, page });
        pages += 1;

        for (const item of res.data) {
          try {
            const logical = await this.riftrune.getCard(item.variantNumber);
            if (syncedCardIds.has(logical.id)) continue;
            await this.cards.upsertFromUpstream(logical);
            syncedCardIds.add(logical.id);
          } catch (err) {
            console.warn(`Catalog sync skipped ${item.variantNumber}:`, err);
          }
        }

        hasMore =
          res.pagination.hasNext &&
          page < res.pagination.totalPages &&
          pages < maxPages;
        page += 1;
      }

      const variantCount = await this.cards.countVariants();

      await this.setSyncStatus('catalog', 'idle', {
        contentHash: fingerprint,
        rowCount: variantCount,
        lastSuccessAt: now,
      });

      return { changed: true, pages, variantCount, hash: fingerprint };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.setSyncStatus('catalog', 'failed', { lastError: message });
      throw err;
    }
  }

  async getStatus() {
    const catalog = await this.db.query.syncState.findFirst({
      where: eq(syncState.key, 'catalog'),
    });
    const prices = await this.db.query.syncState.findFirst({
      where: eq(syncState.key, 'prices'),
    });

    return {
      catalog: {
        lastRun: catalog?.lastSuccessAt?.toISOString() ?? null,
        status: (catalog?.status ?? 'idle') as 'idle' | 'running' | 'failed',
        hash: catalog?.contentHash ?? '',
        variantCount: catalog?.rowCount ?? 0,
      },
      prices: {
        lastRun: prices?.lastSuccessAt?.toISOString() ?? null,
        status: (prices?.status ?? 'idle') as 'idle' | 'running' | 'failed',
        hash: prices?.contentHash ?? '',
        rowCount: prices?.rowCount ?? 0,
      },
    };
  }

  private async setSyncStatus(
    key: string,
    status: string,
    extra?: {
      contentHash?: string;
      rowCount?: number;
      lastSuccessAt?: Date;
      lastError?: string | null;
    }
  ) {
    const now = new Date();
    await this.db
      .insert(syncState)
      .values({
        key,
        status,
        contentHash: extra?.contentHash ?? '',
        rowCount: extra?.rowCount ?? 0,
        lastAttemptAt: now,
        lastSuccessAt: extra?.lastSuccessAt ?? null,
        lastError: extra?.lastError ?? null,
      })
      .onConflictDoUpdate({
        target: syncState.key,
        set: {
          status,
          lastAttemptAt: now,
          ...(extra?.contentHash !== undefined
            ? { contentHash: extra.contentHash }
            : {}),
          ...(extra?.rowCount !== undefined ? { rowCount: extra.rowCount } : {}),
          ...(extra?.lastSuccessAt !== undefined
            ? { lastSuccessAt: extra.lastSuccessAt }
            : {}),
          ...(extra?.lastError !== undefined ? { lastError: extra.lastError } : {}),
        },
      });
  }
}
