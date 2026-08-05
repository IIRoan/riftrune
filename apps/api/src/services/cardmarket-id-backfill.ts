import { eq, isNotNull, isNull } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { cards, prices, sets, variants } from '../db/schema.js';
import {
  buildSetExpansionMap,
  inferExpansionId,
  matchVariantsToProducts,
  type VariantForCardmarketMatch,
} from '../lib/cardmarket-id-match.js';
import {
  fetchCardmarketProductCatalog,
} from '../upstream/cardmarket-products.js';

interface UnmappedVariantRow {
  id: string;
  variantNumber: string;
  variantLabel: string;
  variantType: string;
  rarity: string;
  cardName: string;
  setCode: string;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

export class CardmarketIdBackfillService {
  constructor(private readonly db: Database) {}

  async backfillMissingIds(gameId: number): Promise<{ updated: number; skipped: number }> {
    const exportData = await fetchCardmarketProductCatalog(gameId);
    const productsById = new Map(
      exportData.products.map((product) => [product.idProduct, product] as const)
    );
    const productsByExpansion = groupBy(exportData.products, (product) =>
      String(product.idExpansion)
    );

    const mappedRows = await this.db
      .select({
        setCode: sets.code,
        cardmarketId: variants.cardmarketId,
      })
      .from(variants)
      .innerJoin(sets, eq(variants.setId, sets.id))
      .where(isNotNull(variants.cardmarketId));

    const setExpansionMap = buildSetExpansionMap(
      mappedRows.flatMap((row) =>
        row.cardmarketId == null
          ? []
          : [{ setCode: row.setCode, cardmarketId: row.cardmarketId }]
      ),
      productsById
    );

    const unmapped = await this.db
      .select({
        id: variants.id,
        variantNumber: variants.variantNumber,
        variantLabel: variants.variantLabel,
        variantType: variants.variantType,
        rarity: variants.rarity,
        cardName: cards.name,
        setCode: sets.code,
      })
      .from(variants)
      .innerJoin(cards, eq(variants.cardId, cards.id))
      .innerJoin(sets, eq(variants.setId, sets.id))
      .where(isNull(variants.cardmarketId));

    const priceRankByProduct = await this.loadFoilTrendRanks();
    const assignments = new Map<string, number>();

    const bySet = groupBy(unmapped, (row) => row.setCode);
    for (const [setCode, setVariants] of bySet) {
      const expansionId =
        setExpansionMap.get(setCode) ??
        inferExpansionId(setVariants, productsByExpansion);
      if (expansionId == null) continue;

      const expansionProducts = productsByExpansion.get(String(expansionId)) ?? [];
      const productsByName = groupBy(expansionProducts, (product) => product.name);

      const byName = groupBy(setVariants, (row) => row.cardName);
      for (const [cardName, cardVariants] of byName) {
        const products = productsByName.get(cardName) ?? [];
        if (products.length === 0) continue;

        const matches = matchVariantsToProducts(
          cardVariants.map(toMatchVariant),
          products,
          priceRankByProduct
        );

        for (const variant of cardVariants) {
          const cardmarketId = matches.get(variant.variantNumber);
          if (cardmarketId == null) continue;
          assignments.set(variant.id, cardmarketId);
        }
      }
    }

    let updated = 0;
    for (const [variantId, cardmarketId] of assignments) {
      await this.db
        .update(variants)
        .set({ cardmarketId, updatedAt: new Date() })
        .where(eq(variants.id, variantId));
      updated += 1;
    }

    return { updated, skipped: unmapped.length - updated };
  }

  private async loadFoilTrendRanks(): Promise<Map<number, number>> {
    const rows = await this.db
      .select({
        cardmarketId: prices.cardmarketId,
        marketPrice: prices.marketPrice,
      })
      .from(prices)
      .where(eq(prices.isFoil, true));

    const ranks = new Map<number, number>();
    for (const row of rows) {
      const market = row.marketPrice == null ? 0 : Number(row.marketPrice);
      ranks.set(row.cardmarketId, Number.isFinite(market) ? market : 0);
    }
    return ranks;
  }
}

function toMatchVariant(row: UnmappedVariantRow): VariantForCardmarketMatch {
  return {
    variantNumber: row.variantNumber,
    variantLabel: row.variantLabel,
    variantType: row.variantType,
    rarity: row.rarity,
  };
}
