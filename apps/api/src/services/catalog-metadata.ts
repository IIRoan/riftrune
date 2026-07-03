import { FilterSnapshot } from '@riftbound/contracts';
import { desc, eq } from 'drizzle-orm';
import { computeCatalogTotal } from '../lib/catalog-total.js';
import { catalogFingerprint, entityHash } from '../lib/hash.js';
import type { Database } from '../db/client.js';
import { filterSnapshots, syncState } from '../db/schema.js';
import type { RiftruneClient } from '../upstream/riftrune-client.js';
import {
  enrichFilterSnapshotWithPrintCounts,
  probeExpandedCatalog,
  snapshotHasPrintCounts,
} from './catalog-probe.js';

export type FiltersMeta = {
  snapshot: FilterSnapshot;
  cachedAt: string;
  catalogHash: string;
  variantCount: number;
};

export class CatalogMetadataService {
  private probePromise: Promise<FilterSnapshot> | null = null;

  constructor(
    private readonly db: Database,
    private readonly riftrune: RiftruneClient
  ) {}

  async getFiltersMeta(): Promise<FiltersMeta> {
    const snapshot = await this.ensureExpandedPrintCounts();
    const latest = await this.db.query.filterSnapshots.findFirst({
      orderBy: [desc(filterSnapshots.capturedAt)],
    });
    const catalog = await this.db.query.syncState.findFirst({
      where: eq(syncState.key, 'catalog'),
    });

    return {
      snapshot,
      cachedAt: (latest?.capturedAt ?? new Date()).toISOString(),
      catalogHash: catalog?.contentHash ?? '',
      variantCount: computeCatalogTotal(snapshot, catalog?.rowCount ?? 0),
    };
  }

  async ensureExpandedPrintCounts(force = false): Promise<FilterSnapshot> {
    if (process.env.CATALOG_PROBE_DISABLED === 'true') {
      return this.loadLatestSnapshot();
    }

    const probe = await this.riftrune.listCards({ limit: 1, page: 1 });
    const fingerprint = catalogFingerprint(
      probe.pagination.total,
      probe.meta?.filters ?? {}
    );
    const baseFilters = FilterSnapshot.parse(
      probe.meta?.filters ?? {
        colors: [],
        sets: [],
        types: [],
        supertypes: [],
        rarities: [],
        variants: [],
      }
    );

    const existing = await this.db.query.syncState.findFirst({
      where: eq(syncState.key, 'catalog'),
    });
    const latest = await this.loadLatestSnapshotRecord();
    const latestParsed = latest?.snapshot ?? null;

    const needsProbe =
      force ||
      !latestParsed ||
      !snapshotHasPrintCounts(latestParsed) ||
      existing?.contentHash !== fingerprint;

    if (!needsProbe && latestParsed) {
      return latestParsed;
    }

    if (!this.probePromise) {
      this.probePromise = this.runProbe(baseFilters, fingerprint).finally(() => {
        this.probePromise = null;
      });
    }

    return this.probePromise;
  }

  private async runProbe(
    baseFilters: FilterSnapshot,
    fingerprint: string
  ): Promise<FilterSnapshot> {
    console.log('Probing expanded catalog print counts from Piltover Archive…');
    const expanded = await probeExpandedCatalog(this.riftrune);
    const enriched = enrichFilterSnapshotWithPrintCounts(
      baseFilters,
      expanded.setPrintTotals
    );

    const now = new Date();
    await this.db.insert(filterSnapshots).values({
      snapshot: enriched,
      contentHash: entityHash(enriched),
    });
    await this.db
      .insert(syncState)
      .values({
        key: 'catalog',
        status: 'idle',
        contentHash: fingerprint,
        rowCount: expanded.catalogPrintTotal,
        lastAttemptAt: now,
        lastSuccessAt: now,
        lastError: null,
      })
      .onConflictDoUpdate({
        target: syncState.key,
        set: {
          status: 'idle',
          contentHash: fingerprint,
          rowCount: expanded.catalogPrintTotal,
          lastAttemptAt: now,
          lastSuccessAt: now,
          lastError: null,
        },
      });

    return enriched;
  }

  private async loadLatestSnapshotRecord() {
    const row = await this.db.query.filterSnapshots.findFirst({
      orderBy: [desc(filterSnapshots.capturedAt)],
    });
    if (!row?.snapshot) return null;
    return { snapshot: FilterSnapshot.parse(row.snapshot), capturedAt: row.capturedAt };
  }

  private async loadLatestSnapshot(): Promise<FilterSnapshot> {
    const latest = await this.loadLatestSnapshotRecord();
    if (latest) return latest.snapshot;

    const probe = await this.riftrune.listCards({ limit: 1, page: 1 });
    return FilterSnapshot.parse(
      probe.meta?.filters ?? {
        colors: [],
        sets: [],
        types: [],
        supertypes: [],
        rarities: [],
        variants: [],
      }
    );
  }
}
