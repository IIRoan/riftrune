import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { CardsListQuery, CardDetail, CardListItem } from '@riftbound/contracts';
import type { PaLogicalCard, PaVariant } from '@riftbound/contracts';
import type { Database } from '../db/client.js';
import { cardColors, cards, colors, sets, syncState, variants } from '../db/schema.js';
import type { RiftruneClient } from '../upstream/riftrune-client.js';
import {
  mapCardDetail,
  mapListItem,
  groupCatalogListItems,
  groupCardListItems,
  paCardHash,
  paVariantHash,
} from './card-mapper.js';
import type { PriceCacheService } from './price-cache.js';
import type { ImageStoreService } from './image-store.js';
import { buildCardSearchCondition, buildSearchRelevanceOrder } from '../lib/search.js';
import { TtlCache } from '../lib/ttl-cache.js';

const SEARCH_RESULT_TTL_MS = 5 * 60 * 1000;
const UPSTREAM_CHECK_TTL_MS = 15 * 60 * 1000;
/** Cap variant rows loaded for text search before in-memory grouping. */
const SEARCH_VARIANT_FETCH_CAP = 500;

type SearchResult = {
  items: CardListItem[];
  total: number;
  catalogHash: string;
  source: 'cache' | 'upstream' | 'mixed';
};

function searchCacheKey(query: CardsListQuery, catalogHash: string): string {
  return JSON.stringify({
    catalogHash,
    q: query.q?.trim().toLowerCase() ?? '',
    sets: query.sets ?? '',
    colors: query.colors ?? '',
    types: query.types ?? '',
    rarities: query.rarities ?? '',
    energyMin: query.energyMin,
    energyMax: query.energyMax,
    powerMin: query.powerMin,
    powerMax: query.powerMax,
    mightMin: query.mightMin,
    mightMax: query.mightMax,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    dir: query.dir,
  });
}

function upstreamCheckKey(query: CardsListQuery): string {
  return JSON.stringify({
    q: query.q?.trim().toLowerCase() ?? '',
    limit: query.limit,
    page: query.page,
    sortBy: query.sortBy,
    dir: query.dir,
  });
}

export class CardCacheService {
  private readonly searchCache = new TtlCache<SearchResult>(SEARCH_RESULT_TTL_MS, 100);
  private readonly upstreamCheckCache = new TtlCache<true>(UPSTREAM_CHECK_TTL_MS, 200);

  constructor(
    private readonly db: Database,
    private readonly riftrune: RiftruneClient,
    private readonly prices: PriceCacheService,
    private readonly images: ImageStoreService
  ) {}

  private async priceRowsForLogicalCard(card: PaLogicalCard) {
    const cardmarketIds = card.variants
      .map((variant) => variant.cardmarketId)
      .filter((id): id is number => id != null);
    return this.prices.getRowsForCardmarketIds(cardmarketIds);
  }

  invalidateSearchCache(): void {
    this.searchCache.clear();
  }

  async getCatalogHash(): Promise<string> {
    const row = await this.db.query.syncState.findFirst({
      where: eq(syncState.key, 'catalog'),
    });
    return row?.contentHash ?? '';
  }

  async upsertFromUpstream(card: PaLogicalCard): Promise<boolean> {
    const hash = paCardHash(card);
    const existing = await this.db.query.cards.findFirst({
      where: eq(cards.id, card.id),
    });
    if (existing?.contentHash === hash) {
      return false;
    }

    const now = new Date();

    await this.db.transaction(async (tx) => {
      for (const c of card.colors) {
        await tx
          .insert(colors)
          .values({
            id: c.id,
            name: c.name,
            hexCode: c.hexCode ?? null,
            imageUrl: c.imageUrl ?? null,
          })
          .onConflictDoUpdate({
            target: colors.id,
            set: {
              name: c.name,
              hexCode: c.hexCode ?? null,
              imageUrl: c.imageUrl ?? null,
            },
          });
      }

      await tx
        .insert(cards)
        .values({
          id: card.id,
          name: card.name,
          type: card.type,
          super: card.super ?? null,
          description: card.description,
          energy: card.energy,
          might: card.might,
          power: card.power,
          tags: card.tags,
          attachText: card.attachText ?? null,
          effect: card.effect ?? null,
          mightBonus: card.mightBonus ?? 0,
          maxCopies: card.maxCopies ?? null,
          banEffectiveDate: card.banEffectiveDate
            ? new Date(card.banEffectiveDate)
            : null,
          contentHash: hash,
          upstreamRaw: card,
          fetchedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: cards.id,
          set: {
            name: card.name,
            type: card.type,
            super: card.super ?? null,
            description: card.description,
            energy: card.energy,
            might: card.might,
            power: card.power,
            tags: card.tags,
            contentHash: hash,
            upstreamRaw: card,
            fetchedAt: now,
            updatedAt: now,
          },
        });

      await tx.delete(cardColors).where(eq(cardColors.cardId, card.id));

      for (const c of card.colors) {
        await tx.insert(cardColors).values({ cardId: card.id, colorId: c.id });
      }

      for (const variant of card.variants) {
        await this.upsertVariant(tx, card.id, variant, now);
      }
    });

    return true;
  }

  private mapDetail(card: PaLogicalCard, priceRows: Parameters<typeof mapCardDetail>[1]) {
    return mapCardDetail(this.images.rewriteCard(card), priceRows);
  }

  private mapItem(
    card: PaLogicalCard,
    variant: PaVariant,
    priceRows: Parameters<typeof mapListItem>[2]
  ) {
    const rewritten = this.images.rewriteCard(card);
    const rewrittenVariant =
      rewritten.variants.find((v) => v.variantNumber === variant.variantNumber) ??
      {
        ...variant,
        imageUrl: this.images.rewriteImageUrl(variant.imageUrl),
      };
    return mapListItem(rewritten, rewrittenVariant, priceRows);
  }

  private async upsertVariant(
    tx: Parameters<Parameters<Database['transaction']>[0]>[0],
    cardId: string,
    variant: PaVariant,
    now: Date
  ) {
    const vHash = paVariantHash(variant);

    await tx
      .insert(sets)
      .values({
        id: variant.set.id,
        code: variant.set.prefix,
        name: variant.set.name,
        releaseDate: variant.set.releaseDate ?? null,
      })
      .onConflictDoUpdate({
        target: sets.id,
        set: {
          code: variant.set.prefix,
          name: variant.set.name,
          releaseDate: variant.set.releaseDate ?? null,
          updatedAt: now,
        },
      });

    await tx
      .insert(variants)
      .values({
        id: variant.id,
        cardId,
        variantNumber: variant.variantNumber,
        rarity: variant.rarity,
        variantType: variant.variantType,
        foilMode: variant.foilMode,
        variantTypes: variant.variantTypes,
        imageUrl: variant.imageUrl,
        flavorText: variant.flavorText ?? null,
        artist: variant.artist ?? null,
        releaseDate: variant.releaseDate ?? null,
        variantLabel: variant.variantLabel,
        showInLibrary: variant.showInLibrary,
        isCollectible: variant.isCollectible,
        cardmarketId: variant.cardmarketId ?? null,
        tcgplayerId: variant.tcgplayerId ?? null,
        parentVariantId: variant.parentVariantId ?? null,
        setId: variant.set.id,
        contentHash: vHash,
        upstreamRaw: variant,
        fetchedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: variants.id,
        set: {
          cardId,
          variantNumber: variant.variantNumber,
          rarity: variant.rarity,
          imageUrl: variant.imageUrl,
          contentHash: vHash,
          upstreamRaw: variant,
          cardmarketId: variant.cardmarketId ?? null,
          fetchedAt: now,
          updatedAt: now,
        },
      });
  }

  async getByVariantNumber(
    variantNumber: string,
    options?: { refresh?: boolean }
  ): Promise<{
    detail: CardDetail;
    source: 'cache' | 'upstream' | 'cache-refreshed';
    contentHash: string;
  }> {
    const cached = await this.loadCardDetailFromDb(variantNumber);

    if (cached && !options?.refresh) {
      return {
        detail: cached.detail,
        source: 'cache',
        contentHash: cached.contentHash,
      };
    }

    const upstream = await this.riftrune.getCard(variantNumber);
    const changed = await this.upsertFromUpstream(upstream);
    const priceRows = await this.priceRowsForLogicalCard(upstream);
    const detail = this.mapDetail(upstream, priceRows);

    return {
      detail,
      source: cached ? (changed ? 'cache-refreshed' : 'cache') : 'upstream',
      contentHash: paCardHash(upstream),
    };
  }

  private async loadCardDetailFromDb(variantNumber: string) {
    const variantRow = await this.db.query.variants.findFirst({
      where: eq(variants.variantNumber, variantNumber),
    });
    if (!variantRow) return null;

    const cardRow = await this.db.query.cards.findFirst({
      where: eq(cards.id, variantRow.cardId),
    });
    if (!cardRow) return null;

    const upstream = cardRow.upstreamRaw as PaLogicalCard;
    const priceRows = await this.priceRowsForLogicalCard(upstream);
    return {
      detail: this.mapDetail(upstream, priceRows),
      contentHash: cardRow.contentHash,
    };
  }

  async batchGet(variantNumbers: string[]): Promise<{
    found: CardDetail[];
    notFound: string[];
    source: 'cache' | 'mixed' | 'upstream';
  }> {
    const found: CardDetail[] = [];
    const missing: string[] = [];

    for (const vn of variantNumbers) {
      const cached = await this.loadCardDetailFromDb(vn);
      if (cached) {
        found.push(cached.detail);
      } else {
        missing.push(vn);
      }
    }

    if (missing.length === 0) {
      return { found, notFound: [], source: 'cache' };
    }

    const batch = await this.riftrune.batchCards(missing);
    for (const item of batch.data) {
      const logical = await this.riftrune.getCard(item.variantNumber);
      await this.upsertFromUpstream(logical);
      const priceRows = await this.priceRowsForLogicalCard(logical);
      found.push(this.mapDetail(logical, priceRows));
    }

    return {
      found,
      notFound: batch.notFound,
      source: found.length === variantNumbers.length ? 'upstream' : 'mixed',
    };
  }

  async search(query: CardsListQuery): Promise<SearchResult> {
    const catalogHash = await this.getCatalogHash();
    const cacheKey = searchCacheKey(query, catalogHash);

    if (!query.refresh) {
      const cached = this.searchCache.get(cacheKey);
      if (cached) return cached;
    }

    let source: 'cache' | 'upstream' | 'mixed' = 'cache';
    let result = await this.searchLocal(query);

    const q = query.q?.trim();
    const shouldReconcileUpstream =
      q && q.length >= 2 && query.page === 1 && !this.upstreamCheckCache.has(upstreamCheckKey(query));

    if (shouldReconcileUpstream) {
      if (query.refresh || result.total === 0) {
        const reconciled = await this.reconcileSearchWithUpstream(query, result);
        result = reconciled.result;
        source = reconciled.source;
      } else {
        this.scheduleSearchReconciliation(query, cacheKey, result);
      }
    }

    const response: SearchResult = { ...result, source };
    this.searchCache.set(cacheKey, response);
    return response;
  }

  private scheduleSearchReconciliation(
    query: CardsListQuery,
    cacheKey: string,
    localResult: { items: CardListItem[]; total: number }
  ): void {
    void this.reconcileSearchWithUpstream(query, localResult)
      .then(async (reconciled) => {
        if (reconciled.source === 'cache') return;
        const refreshed = await this.searchLocal(query);
        this.searchCache.set(cacheKey, { ...refreshed, source: reconciled.source });
      })
      .catch((err) => {
        console.warn('Background search reconciliation failed:', err);
      });
  }

  private async reconcileSearchWithUpstream(
    query: CardsListQuery,
    localResult?: { items: CardListItem[]; total: number }
  ): Promise<{
    result: { items: CardListItem[]; total: number; catalogHash: string };
    source: 'cache' | 'upstream' | 'mixed';
  }> {
    const q = query.q?.trim();
    if (!q || q.length < 2 || query.page !== 1) {
      return { result: await this.searchLocal(query), source: 'cache' };
    }

    this.upstreamCheckCache.set(upstreamCheckKey(query), true);

    try {
      const upstream = await this.riftrune.listCards({
        q,
        limit: query.limit,
        page: query.page,
        sortBy: query.sortBy,
        dir: query.dir,
      });

      const localVariantNumbers = new Set(
        (localResult?.items ?? []).map((item) => item.variantNumber)
      );
      const missing = upstream.data.filter(
        (item) => !localVariantNumbers.has(item.variantNumber)
      );

      if (missing.length > 0) {
        for (const item of missing) {
          try {
            const logical = await this.riftrune.getCard(item.variantNumber);
            await this.upsertFromUpstream(logical);
          } catch (err) {
            console.warn(`Search backfill skipped ${item.variantNumber}:`, err);
          }
        }
        const result = await this.searchLocal(query);
        return { result, source: 'mixed' };
      }

      if ((localResult?.total ?? 0) === 0 && upstream.data.length === 0) {
        return { result: await this.searchLocal(query), source: 'upstream' };
      }

      return { result: await this.searchLocal(query), source: 'cache' };
    } catch (err) {
      console.warn('Upstream search unavailable, using local cache only:', err);
      return { result: await this.searchLocal(query), source: 'cache' };
    }
  }

  private async searchLocal(query: CardsListQuery): Promise<{
    items: CardListItem[];
    total: number;
    catalogHash: string;
  }> {
    const conditions = [];

    if (query.q) {
      const searchCond = buildCardSearchCondition(query.q);
      if (searchCond) conditions.push(searchCond);
    }
    if (query.sets) {
      const setCodes = query.sets.split(',').map((s) => s.trim());
      conditions.push(inArray(sets.code, setCodes));
    }
    if (query.energyMin !== undefined) {
      conditions.push(sql`${cards.energy} >= ${query.energyMin}`);
    }
    if (query.energyMax !== undefined) {
      conditions.push(sql`${cards.energy} <= ${query.energyMax}`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const order =
      query.q && query.q.trim().length > 0
        ? asc(buildSearchRelevanceOrder(query.q))
        : query.sortBy === 'energy'
          ? query.dir === 'desc'
            ? desc(cards.energy)
            : asc(cards.energy)
          : query.sortBy === 'variantNumber'
            ? query.dir === 'desc'
              ? desc(variants.variantNumber)
              : asc(variants.variantNumber)
            : query.dir === 'desc'
              ? desc(cards.name)
              : asc(cards.name);

    const offset = (query.page - 1) * query.limit;
    const hasSearch = Boolean(query.q?.trim());
    const orderBy = query.q && query.q.trim().length > 0
      ? [asc(buildSearchRelevanceOrder(query.q)), asc(cards.name)]
      : [order];

    const baseQuery = this.db
      .select({
        card: cards,
        variant: variants,
        setCode: sets.code,
      })
      .from(variants)
      .innerJoin(cards, eq(variants.cardId, cards.id))
      .innerJoin(sets, eq(variants.setId, sets.id))
      .where(where)
      .orderBy(...orderBy);

    const rows = hasSearch
      ? await baseQuery.limit(SEARCH_VARIANT_FETCH_CAP)
      : await baseQuery.limit(query.limit).offset(offset);

    const priceRows = await this.prices.getRowsForCardmarketIds(
      rows
        .map((row) => row.variant.cardmarketId)
        .filter((id): id is number => id != null)
    );

    const rawItems = rows.map((row) => {
      const logical = row.card.upstreamRaw as PaLogicalCard;
      const variant = row.variant.upstreamRaw as PaVariant;
      return this.mapItem(logical, variant, priceRows);
    });

    if (hasSearch) {
      const grouped = groupCardListItems(rawItems);
      let total = grouped.length;

      if (rows.length >= SEARCH_VARIANT_FETCH_CAP) {
        const [countRow] = await this.db
          .select({ value: count() })
          .from(variants)
          .innerJoin(cards, eq(variants.cardId, cards.id))
          .innerJoin(sets, eq(variants.setId, sets.id))
          .where(where);
        total = countRow?.value ?? grouped.length;
      }

      return {
        items: grouped.slice(offset, offset + query.limit),
        total,
        catalogHash: await this.getCatalogHash(),
      };
    }

    const grouped = groupCatalogListItems(rawItems);

    const [totalRow] = await this.db
      .select({
        value: count(),
      })
      .from(variants)
      .innerJoin(cards, eq(variants.cardId, cards.id))
      .innerJoin(sets, eq(variants.setId, sets.id))
      .where(where);

    return {
      items: grouped,
      total: totalRow?.value ?? 0,
      catalogHash: await this.getCatalogHash(),
    };
  }

  async countVariants(): Promise<number> {
    const [row] = await this.db.select({ value: count() }).from(variants);
    return row?.value ?? 0;
  }
}
