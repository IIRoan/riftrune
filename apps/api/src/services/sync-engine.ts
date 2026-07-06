import { eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { syncState } from '../db/schema.js';
import { catalogFingerprint } from '../lib/hash.js';
import { computeCatalogTotal } from '../lib/catalog-total.js';
import type { RiftruneClient } from '../upstream/riftrune-client.js';
import type { CardCacheService } from './card-cache.js';
import type { CatalogMetadataService } from './catalog-metadata.js';
import { accumulatePrintCounts } from './catalog-probe.js';

export class SyncEngine {
  constructor(
    private readonly db: Database,
    private readonly riftrune: RiftruneClient,
    private readonly cards: CardCacheService,
    private readonly catalogMetadata: CatalogMetadataService
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

      const enrichedFilters = await this.catalogMetadata.ensureExpandedPrintCounts(
        existing?.contentHash !== fingerprint
      );
      const catalogPrintTotal = computeCatalogTotal(
        enrichedFilters,
        existing?.rowCount ?? 0
      );

      if (existing?.contentHash === fingerprint && (existing.rowCount ?? 0) > 0) {
        console.log(
          `[sync] Catalog unchanged (hash=${fingerprint}), skipping card upsert — image mirroring will not run`
        );
        await this.setSyncStatus('catalog', 'idle', {
          contentHash: fingerprint,
          rowCount: Math.max(existing.rowCount ?? 0, catalogPrintTotal),
          lastSuccessAt: existing.lastSuccessAt ?? now,
        });
        return {
          changed: false,
          pages: 0,
          variantCount: Math.max(existing.rowCount ?? 0, catalogPrintTotal),
          hash: fingerprint,
        };
      }

      let page = 1;
      let pages = 0;
      const limit = 100;
      let hasMore = true;
      const maxPages = Number(process.env.SYNC_MAX_PAGES ?? 0) || Infinity;
      const syncedCardIds = new Set<string>();
      const setPrintTotals = new Map<string, number>();

      console.log(
        `[sync] Starting catalog sync (fingerprint=${fingerprint}, maxPages=${maxPages === Infinity ? 'all' : String(maxPages)})`
      );

      for (const set of enrichedFilters.sets) {
        if (set.printCount != null && set.code) {
          setPrintTotals.set(set.code, set.printCount);
        }
      }

      while (hasMore) {
        const res = await this.riftrune.listCards({ limit, page });
        pages += 1;
        console.log(
          `[sync] Processing page ${String(page)} (${String(res.data.length)} list items)`
        );

        for (const item of res.data) {
          try {
            const logical = await this.riftrune.getCard(item.variantNumber);
            if (syncedCardIds.has(logical.id)) continue;
            await this.cards.upsertFromUpstream(logical);
            accumulatePrintCounts(logical, setPrintTotals);
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

      const syncedVariantRows = await this.cards.countVariants();
      const finalPrintTotal = Math.max(
        catalogPrintTotal,
        computeCatalogTotal(enrichedFilters, 0),
        syncedVariantRows
      );

      await this.setSyncStatus('catalog', 'idle', {
        contentHash: fingerprint,
        rowCount: finalPrintTotal,
        lastSuccessAt: now,
      });

      this.cards.invalidateSearchCache();

      console.log(
        `[sync] Catalog sync complete: ${String(syncedCardIds.size)} logical cards, ${String(pages)} pages, ${String(finalPrintTotal)} printings`
      );

      return { changed: true, pages, variantCount: finalPrintTotal, hash: fingerprint };
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
