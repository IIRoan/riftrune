import type { CardmarketProduct } from '../upstream/cardmarket-products.js';

export interface VariantForCardmarketMatch {
  variantNumber: string;
  variantLabel: string;
  variantType: string;
  rarity: string;
}

function sortVariants(items: VariantForCardmarketMatch[]): VariantForCardmarketMatch[] {
  return [...items].sort((a, b) => a.variantNumber.localeCompare(b.variantNumber));
}

function sortProducts(items: CardmarketProduct[]): CardmarketProduct[] {
  return [...items].sort((a, b) => a.idProduct - b.idProduct);
}

function isPremiumVariant(variant: VariantForCardmarketMatch): boolean {
  const haystack = `${variant.variantType} ${variant.variantLabel} ${variant.rarity}`;
  return /alt art|showcase|overnumbered|promo|signed|textured|borderless/i.test(
    haystack
  );
}

/** Pair catalog printings with Cardmarket products that share a card name within one expansion. */
export function matchVariantsToProducts(
  variants: VariantForCardmarketMatch[],
  products: CardmarketProduct[],
  priceRankByProduct?: ReadonlyMap<number, number>
): Map<string, number> {
  const result = new Map<string, number>();
  if (variants.length === 0 || products.length === 0) return result;

  const sortedVariants = sortVariants(variants);
  const sortedProducts = sortProducts(products);

  if (sortedVariants.length === sortedProducts.length) {
    for (let index = 0; index < sortedVariants.length; index += 1) {
      const variant = sortedVariants[index]!;
      const product = sortedProducts[index]!;
      result.set(variant.variantNumber, product.idProduct);
    }
    return result;
  }

  if (sortedProducts.length > sortedVariants.length) {
    const standard = sortedVariants.filter((variant) => !isPremiumVariant(variant));
    const premium = sortedVariants.filter((variant) => isPremiumVariant(variant));
    const used = new Set<number>();

    for (const variant of standard) {
      const product = sortedProducts.find((row) => !used.has(row.idProduct));
      if (!product) continue;
      result.set(variant.variantNumber, product.idProduct);
      used.add(product.idProduct);
    }

    const remaining = sortedProducts.filter((row) => !used.has(row.idProduct));
    remaining.sort((left, right) => {
      const leftRank = priceRankByProduct?.get(left.idProduct) ?? left.idProduct;
      const rightRank = priceRankByProduct?.get(right.idProduct) ?? right.idProduct;
      return rightRank - leftRank;
    });

    for (let index = 0; index < premium.length && index < remaining.length; index += 1) {
      const variant = premium[index]!;
      const product = remaining[index]!;
      result.set(variant.variantNumber, product.idProduct);
    }
    return result;
  }

  for (let index = 0; index < Math.min(sortedVariants.length, sortedProducts.length); index += 1) {
    const variant = sortedVariants[index]!;
    const product = sortedProducts[index]!;
    result.set(variant.variantNumber, product.idProduct);
  }

  return result;
}

/** Derive Cardmarket expansion ids from variants that already carry a mapped product id. */
export function buildSetExpansionMap(
  rows: { setCode: string; cardmarketId: number }[],
  productsById: ReadonlyMap<number, CardmarketProduct>
): Map<string, number> {
  const counts = new Map<string, Map<number, number>>();

  for (const row of rows) {
    const product = productsById.get(row.cardmarketId);
    if (!product) continue;

    const byExpansion = counts.get(row.setCode) ?? new Map<number, number>();
    byExpansion.set(product.idExpansion, (byExpansion.get(product.idExpansion) ?? 0) + 1);
    counts.set(row.setCode, byExpansion);
  }

  const result = new Map<string, number>();
  for (const [setCode, byExpansion] of counts) {
    let bestExpansion = -1;
    let bestCount = -1;
    for (const [expansionId, hitCount] of byExpansion) {
      if (hitCount > bestCount) {
        bestExpansion = expansionId;
        bestCount = hitCount;
      }
    }
    if (bestExpansion >= 0) result.set(setCode, bestExpansion);
  }

  return result;
}

/** Guess Cardmarket expansion when upstream omitted product ids for an entire set. */
export function inferExpansionId(
  variants: { cardName: string }[],
  productsByExpansion: ReadonlyMap<string, readonly CardmarketProduct[]>
): number | null {
  if (variants.length === 0) return null;

  const cardNames = new Set(variants.map((variant) => variant.cardName));
  let bestExpansion: number | null = null;
  let bestScore = 0;

  for (const [expansionKey, products] of productsByExpansion) {
    const productNames = new Set(products.map((product) => product.name));
    let score = 0;
    for (const name of cardNames) {
      if (productNames.has(name)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestExpansion = Number(expansionKey);
    }
  }

  const minimumMatches = Math.min(
    cardNames.size,
    Math.max(3, Math.ceil(cardNames.size * 0.5))
  );
  return bestScore >= minimumMatches ? bestExpansion : null;
}
