import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { CardsListQuery, CardDetail, CardListItem } from '@riftbound/contracts';
import { PaCardsListResponse, type PaLogicalCard, type PaVariant } from '@riftbound/contracts';
import type { Database } from '../db/client.js';
import { cardColors, cards, colors, sets, syncState, variants } from '../db/schema.js';
import type { RiftruneClient } from '../upstream/riftrune-client.js';
import {
  mapCardDetail,
  mapListItem,
  groupCardListItems,
  paCardHash,
  paVariantHash,
} from './card-mapper.js';
import type { PriceCacheService } from './price-cache.js';
import type { ImageStoreService } from './image-store.js';
import { buildCardSearchCondition, buildSearchRelevanceOrder } from '../lib/search.js';
import {
  buildCardColorsContainsAllCondition,
  buildCardColorsWithinCondition,
} from '../lib/card-colors-filter.js';
import { TtlCache } from '../lib/ttl-cache.js';
import {
  buildUpstreamListParams,
  maxUpstreamBackfillPages,
  resolveUpstreamReconcileMode,
  upstreamCheckKey,
} from '../lib/upstream-list-params.js';

const SEARCH_RESULT_TTL_MS = 5 * 60 * 1000;
const UPSTREAM_CHECK_TTL_MS = 15 * 60 * 1000;
const VARIANT_ID_RESOLVE_TTL_MS = 30 * 60 * 1000;
/** Cap variant rows loaded before in-memory printing grouping + pagination. */
const SEARCH_VARIANT_FETCH_CAP = 500;
/** Filtered browse (deck builder) materializes the full matching set, then pages. */
const FILTERED_BROWSE_VARIANT_FETCH_CAP = 5000;

type SearchResult = {
  items: CardListItem[];
  total: number;
  catalogHash: string;
  source: 'cache' | 'upstream' | 'mixed';
};

function searchCacheKey(
  query: CardsListQuery,
  catalogHash: string,
  pricesCatalogHash: string
): string {
  return JSON.stringify({
    catalogHash,
    pricesCatalogHash,
    q: query.q?.trim().toLowerCase() ?? '',
    sets: query.sets ?? '',
    colors: query.colors ?? '',
    colorMode: query.colorMode ?? 'all',
    types: query.types ?? '',
    super: query.super ?? '',
    rarities: query.rarities ?? '',
    variants: query.variants ?? '',
    energyMin: query.energyMin,
    energyMax: query.energyMax,
    powerMin: query.powerMin,
    powerMax: query.powerMax,
    mightMin: query.mightMin,
    mightMax: query.mightMax,
    excludeTokens: query.excludeTokens ?? '',
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    dir: query.dir,
  });
}

export class CardCacheService {
  private readonly searchCache = new TtlCache<SearchResult>(SEARCH_RESULT_TTL_MS, 100);
  private readonly upstreamCheckCache = new TtlCache<true>(UPSTREAM_CHECK_TTL_MS, 200);
  private readonly variantIdResolveCache = new TtlCache<string>(VARIANT_ID_RESOLVE_TTL_MS, 1000);

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

  async getPricesCatalogHash(): Promise<string> {
    const row = await this.db.query.syncState.findFirst({
      where: eq(syncState.key, 'prices'),
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

  /**
   * Resolve an upstream variant UUID to a local variant number, refreshing the card cache when needed.
   */
  async resolveVariantNumbersFromUpstream(
    refs: Array<{ variantId: string; cardId: string }>,
    resolved: Map<string, string>
  ): Promise<void> {
    const pending = new Map<string, string>();

    for (const ref of refs) {
      if (resolved.has(ref.variantId)) continue;

      const local = await this.resolveVariantNumberLocally(ref.variantId, ref.cardId);
      if (local) {
        resolved.set(ref.variantId, local);
        continue;
      }

      pending.set(ref.variantId, ref.cardId);
    }

    if (pending.size > 0) {
      await this.discoverPendingVariantsInUpstreamCatalog(pending, resolved);
    }
  }

  async resolveVariantNumberByUpstreamId(
    variantId: string,
    cardId: string
  ): Promise<string | null> {
    const local = await this.resolveVariantNumberLocally(variantId, cardId);
    if (local) return local;

    const pending = new Map<string, string>([[variantId, cardId]]);
    const resolved = new Map<string, string>();
    await this.discoverPendingVariantsInUpstreamCatalog(pending, resolved);
    return resolved.get(variantId) ?? null;
  }

  private async resolveVariantNumberLocally(
    variantId: string,
    cardId: string
  ): Promise<string | null> {
    const cached = this.variantIdResolveCache.get(variantId);
    if (cached) return cached;

    const byId = await this.db.query.variants.findFirst({
      where: eq(variants.id, variantId),
    });
    if (byId) {
      this.variantIdResolveCache.set(variantId, byId.variantNumber);
      return byId.variantNumber;
    }

    const cardRow = await this.db.query.cards.findFirst({
      where: eq(cards.id, cardId),
    });
    if (cardRow) {
      const logical = cardRow.upstreamRaw as PaLogicalCard;
      const fromRaw = logical.variants.find((variant) => variant.id === variantId);
      if (fromRaw) {
        await this.upsertFromUpstream(logical);
        this.variantIdResolveCache.set(variantId, fromRaw.variantNumber);
        return fromRaw.variantNumber;
      }

      const seedVariant = logical.variants[0];
      if (seedVariant) {
        try {
          const refreshed = await this.getByVariantNumber(seedVariant.variantNumber, {
            refresh: true,
          });
          const match = refreshed.detail.variants.find((variant) => variant.id === variantId);
          if (match) {
            this.variantIdResolveCache.set(variantId, match.variantNumber);
            return match.variantNumber;
          }
        } catch {
          // Fall through to sibling lookup.
        }
      }
    }

    const sibling = await this.db.query.variants.findFirst({
      where: eq(variants.cardId, cardId),
    });
    if (sibling) {
      try {
        const refreshed = await this.getByVariantNumber(sibling.variantNumber, { refresh: true });
        const match = refreshed.detail.variants.find((variant) => variant.id === variantId);
        if (match) {
          this.variantIdResolveCache.set(variantId, match.variantNumber);
          return match.variantNumber;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  private async discoverPendingVariantsInUpstreamCatalog(
    pending: Map<string, string>,
    resolved: Map<string, string>
  ): Promise<void> {
    if (pending.size === 0) return;

    const pendingCardIds = new Set(pending.values());
    const fetchedCardIds = new Set<string>();
    let page = 1;
    const maxPages = 500;

    while (pending.size > 0 && page <= maxPages) {
      const upstream = await this.riftrune.listCards({ page, limit: 100 });
      const res = PaCardsListResponse.parse(upstream);

      for (const item of res.data) {
        if (pending.has(item.id)) {
          try {
            const logical = await this.riftrune.getCard(item.variantNumber);
            await this.upsertFromUpstream(logical);
            resolved.set(item.id, item.variantNumber);
            this.variantIdResolveCache.set(item.id, item.variantNumber);
            pending.delete(item.id);
          } catch (err) {
            console.warn(`Catalog discover skipped ${item.variantNumber}:`, err);
          }
          continue;
        }

        const listCardId =
          item.card &&
          typeof item.card === 'object' &&
          item.card !== null &&
          'id' in item.card &&
          typeof (item.card as { id?: unknown }).id === 'string'
            ? (item.card as { id: string }).id
            : undefined;
        if (!listCardId || !pendingCardIds.has(listCardId) || fetchedCardIds.has(listCardId)) {
          continue;
        }

        fetchedCardIds.add(listCardId);
        try {
          const logical = await this.riftrune.getCard(item.variantNumber);
          await this.upsertFromUpstream(logical);
          for (const variant of logical.variants) {
            if (!pending.has(variant.id)) continue;
            resolved.set(variant.id, variant.variantNumber);
            this.variantIdResolveCache.set(variant.id, variant.variantNumber);
            pending.delete(variant.id);
          }
        } catch (err) {
          console.warn(`Catalog discover skipped logical card ${listCardId}:`, err);
        }
      }

      if (!res.pagination.hasNext || page >= res.pagination.totalPages) break;
      page += 1;
    }
  }

  private async loadCardDetailFromDb(variantNumber: string) {
    const [variantRow] = await this.db
      .select()
      .from(variants)
      .where(sql`lower(${variants.variantNumber}) = ${variantNumber.toLowerCase()}`)
      .limit(1);
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
    const [catalogHash, pricesCatalogHash] = await Promise.all([
      this.getCatalogHash(),
      this.getPricesCatalogHash(),
    ]);
    const cacheKey = searchCacheKey(query, catalogHash, pricesCatalogHash);
    const hasSearchQuery = Boolean(query.q?.trim() && query.q.trim().length >= 2);

    if (!query.refresh) {
      const cached = this.searchCache.get(cacheKey);
      // Never serve a cached miss — a newly added upstream card must be
      // discoverable on the next search. Positive hits may still re-reconcile below.
      if (cached && cached.total > 0 && !hasSearchQuery) return cached;
    }

    let source: 'cache' | 'upstream' | 'mixed' = 'cache';
    let result = await this.searchLocal(query);

    const reconcileMode = resolveUpstreamReconcileMode(
      query,
      result,
      this.upstreamCheckCache.has(upstreamCheckKey(query)) && !query.refresh
    );

    if (reconcileMode === 'sync') {
      const reconciled = await this.reconcileSearchWithUpstream(query, result);
      result = reconciled.result;
      source = reconciled.source;
    }

    const response: SearchResult = { ...result, source };
    // Cache confirmed hits (and confirmed upstream empties) briefly.
    if (response.total > 0 || response.source === 'upstream') {
      this.searchCache.set(cacheKey, response);
    } else {
      this.searchCache.delete(cacheKey);
    }
    return response;
  }

  private async reconcileSearchWithUpstream(
    query: CardsListQuery,
    localResult?: { items: CardListItem[]; total: number }
  ): Promise<{
    result: { items: CardListItem[]; total: number; catalogHash: string };
    source: 'cache' | 'upstream' | 'mixed';
  }> {
    const checkKey = upstreamCheckKey(query);
    const localEmpty = (localResult?.total ?? 0) === 0 || (localResult?.items.length ?? 0) === 0;

    // Prior successful checks may skip only when we already have local hits.
    // Empty local results always re-query upstream.
    if (this.upstreamCheckCache.has(checkKey) && !query.refresh && !localEmpty) {
      return { result: await this.searchLocal(query), source: 'cache' };
    }

    try {
      let upserted = 0;
      let page = query.page;
      let upstreamTotal = 0;
      let pagesScanned = 0;
      let consecutiveCleanPages = 0;
      // Walk until local catches upstream (or hit the hard cap). Deck-builder
      // identity filters previously stopped after 5 pages and missed later cards.
      const maxBackfillPages = maxUpstreamBackfillPages(query);
      const colorsOmittedForWithin =
        query.colorMode === 'within' && Boolean(query.colors);

      while (pagesScanned < maxBackfillPages) {
        const upstream = await this.riftrune.listCards(
          buildUpstreamListParams({ ...query, page })
        );
        pagesScanned += 1;
        upstreamTotal = upstream.pagination?.total ?? upstream.data.length;

        const upstreamVariantNumbers = upstream.data.map((item) => item.variantNumber);
        const existingLocally = await this.findExistingVariantNumbers(upstreamVariantNumbers);
        const missing = upstream.data.filter(
          (item) => !existingLocally.has(item.variantNumber.toLowerCase())
        );

        for (const item of missing) {
          try {
            const logical = await this.riftrune.getCard(item.variantNumber);
            await this.upsertFromUpstream(logical);
            upserted += 1;
          } catch (err) {
            console.warn(`Search backfill skipped ${item.variantNumber}:`, err);
          }
        }

        if (missing.length === 0) consecutiveCleanPages += 1;
        else consecutiveCleanPages = 0;

        const localTotal = (localResult?.total ?? 0) + upserted;
        const stillBehind = upstreamTotal > localTotal;
        const hasNext =
          Boolean(upstream.pagination?.hasNext) &&
          page < (upstream.pagination?.totalPages ?? page);

        // When colors are omitted for within-mode, upstream totals are broader than
        // the local filtered total — use clean-page streaks instead.
        const caughtUp = colorsOmittedForWithin
          ? consecutiveCleanPages >= 5
          : !stillBehind;

        if (caughtUp || !hasNext) break;
        page += 1;
      }

      if (upserted > 0) {
        this.invalidateSearchCache();
      }

      const result = await this.searchLocal(query);

      if (upserted > 0) {
        this.upstreamCheckCache.set(checkKey, true);
        return { result, source: 'mixed' };
      }

      if (localEmpty && upstreamTotal === 0) {
        this.upstreamCheckCache.set(checkKey, true);
        return { result, source: 'upstream' };
      }

      // Upstream reports more matches than we do — keep probing on the next request.
      // Skip this when within-mode omitted colors (upstream total is a broader pool).
      if (!colorsOmittedForWithin && upstreamTotal > result.total) {
        this.upstreamCheckCache.delete(checkKey);
      } else {
        this.upstreamCheckCache.set(checkKey, true);
      }

      return { result, source: 'cache' };
    } catch (err) {
      console.warn('Upstream search unavailable, using local cache only:', err);
      return { result: await this.searchLocal(query), source: 'cache' };
    }
  }

  private async findExistingVariantNumbers(
    variantNumbers: string[]
  ): Promise<Set<string>> {
    if (variantNumbers.length === 0) return new Set();
    const rows = await this.db
      .select({ variantNumber: variants.variantNumber })
      .from(variants)
      .where(
        sql`lower(${variants.variantNumber}) in (${sql.join(
          variantNumbers.map((value) => sql`${value.toLowerCase()}`),
          sql`, `
        )})`
      );
    return new Set(rows.map((row) => row.variantNumber.toLowerCase()));
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
    if (query.powerMin !== undefined) {
      conditions.push(sql`${cards.power} >= ${query.powerMin}`);
    }
    if (query.powerMax !== undefined) {
      conditions.push(sql`${cards.power} <= ${query.powerMax}`);
    }
    if (query.mightMin !== undefined) {
      conditions.push(sql`${cards.might} >= ${query.mightMin}`);
    }
    if (query.mightMax !== undefined) {
      conditions.push(sql`${cards.might} <= ${query.mightMax}`);
    }
    if (query.rarities) {
      const rarityFilters = query.rarities
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      if (rarityFilters.length > 0) {
        conditions.push(inArray(variants.rarity, rarityFilters));
      }
    }
    if (query.variants) {
      const variantFilters = query.variants
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      if (variantFilters.length > 0) {
        conditions.push(
          sql`lower(${variants.variantType}) in (${sql.join(
            variantFilters.map((value) => sql`${value}`),
            sql`, `
          )})`
        );
      }
    }
    if (query.types) {
      const typeFilters = query.types
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      if (typeFilters.length > 0) {
        conditions.push(
          sql`lower(${cards.type}) in (${sql.join(
            typeFilters.map((value) => sql`${value}`),
            sql`, `
          )})`
        );
      }
    }
    if (query.super) {
      const superFilters = query.super
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      if (superFilters.length === 1) {
        conditions.push(sql`lower(${cards.super}) = ${superFilters[0]}`);
      } else if (superFilters.length > 1) {
        conditions.push(
          sql`lower(${cards.super}) in (${sql.join(
            superFilters.map((value) => sql`${value}`),
            sql`, `
          )})`
        );
      }
    }
    if (query.colors) {
      const colorNames = query.colors.split(',').map((value) => value.trim());
      const colorCond =
        query.colorMode === 'within'
          ? buildCardColorsWithinCondition(colorNames)
          : buildCardColorsContainsAllCondition(colorNames);
      if (colorCond) conditions.push(colorCond);
    }
    if (query.excludeTokens) {
      conditions.push(sql`${variants.variantNumber} !~* '-T[0-9]+$'`);
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
    const hasDeckBuilderFilters = Boolean(
      query.types ||
        query.colors ||
        query.sets ||
        query.super ||
        query.variants ||
        query.rarities ||
        query.excludeTokens
    );
    // Materialize then group so alternate arts / foil merges never split across
    // SQL pages (deck builder scroll must see every matching printing).
    const materializeThenPage = hasSearch || hasDeckBuilderFilters;
    const fetchCap = hasSearch ? SEARCH_VARIANT_FETCH_CAP : FILTERED_BROWSE_VARIANT_FETCH_CAP;
    const orderBy =
      query.q && query.q.trim().length > 0
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

    const rows = materializeThenPage
      ? await baseQuery.limit(fetchCap)
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

    if (materializeThenPage) {
      const grouped = groupCardListItems(rawItems);
      let total = grouped.length;

      if (rows.length >= fetchCap) {
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

    const grouped = groupCardListItems(rawItems);

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

  async listIndex(): Promise<{
    items: CardListItem[];
    total: number;
    catalogHash: string;
    pricesCatalogHash: string;
  }> {
    const rows = await this.db
      .select({
        card: cards,
        variant: variants,
        setCode: sets.code,
      })
      .from(variants)
      .innerJoin(cards, eq(variants.cardId, cards.id))
      .innerJoin(sets, eq(variants.setId, sets.id))
      .orderBy(asc(cards.name), asc(variants.variantNumber));

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

    const items = groupCardListItems(rawItems);
    const [catalogHash, pricesCatalogHash] = await Promise.all([
      this.getCatalogHash(),
      this.getPricesCatalogHash(),
    ]);
    return {
      items,
      total: items.length,
      catalogHash,
      pricesCatalogHash,
    };
  }
}
