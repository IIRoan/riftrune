import type { CardListItem, CardListPrinting, CardsListResponse } from '@riftbound/contracts';
import { computeTrend, formatTrendLabel } from '@riftbound/contracts';

export function isFoilVariant(
  variantNumber: string,
  variantLabel?: string,
  variantType?: string
): boolean {
  if (/foil/i.test(variantNumber)) return true;
  if (variantLabel && /foil/i.test(variantLabel)) return true;
  if (variantType && /foil/i.test(variantType)) return true;
  return false;
}

export function variantNumbersMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function findVariantByNumber<T extends { variantNumber: string }>(
  variants: T[],
  variantNumber: string
): T | undefined {
  return variants.find((v) => variantNumbersMatch(v.variantNumber, variantNumber));
}

const syntheticByVariant = new Map<string, CardListPrinting[]>();

function syntheticPrintings(card: CardListItem): CardListPrinting[] {
  const hit = syntheticByVariant.get(card.variantNumber);
  if (hit) return hit;

  const isFoil = isFoilVariant(card.variantNumber);
  const row: CardListPrinting[] = [
    {
      variantNumber: card.variantNumber,
      variantLabel: isFoil ? 'Foil' : 'Standard',
      isFoil,
      priceEur: card.priceEur ?? null,
    },
  ];
  syntheticByVariant.set(card.variantNumber, row);
  return row;
}

/** Fast path when `printings` already present; synthesizes one for legacy cache rows. */
export function getCardPrintings(card: CardListItem): CardListPrinting[] {
  const printings = card.printings;
  return printings && printings.length > 0 ? printings : syntheticPrintings(card);
}

export function normalizeCardListItem(card: CardListItem): CardListItem {
  if (card.printings && card.printings.length > 0) return card;
  return { ...card, printings: syntheticPrintings(card) };
}

export function normalizeCardsListResponse(response: CardsListResponse): CardsListResponse {
  let needsNormalize = false;
  for (const card of response.data) {
    if (!card.printings?.length) {
      needsNormalize = true;
      break;
    }
  }
  if (!needsNormalize) return response;
  return { ...response, data: response.data.map(normalizeCardListItem) };
}

export function normalizeCardListItems(items: CardListItem[]): CardListItem[] {
  if (items.length === 0) return items;
  for (const card of items) {
    if (!card.printings?.length) return items.map(normalizeCardListItem);
  }
  return items;
}

export function formatPrintingLabel(
  variantLabel: string,
  isFoil: boolean,
  variantNumber: string
): string {
  if (variantLabel && variantLabel !== 'Standard') return variantLabel;
  if (isFoil) return 'Foil';
  if (/foil/i.test(variantNumber)) return 'Foil';
  return 'Standard';
}

export function hasMultiplePrintings(printings: CardListPrinting[]): boolean {
  return printings.length > 1;
}

function sortPrintings(printings: CardListPrinting[]): CardListPrinting[] {
  return [...printings].sort((a, b) => {
    if (a.isFoil !== b.isFoil) return a.isFoil ? 1 : -1;
    return a.variantNumber.localeCompare(b.variantNumber);
  });
}

/** Search rows only merge a standard printing with its foil finish — not alternates or overnumbered art. */
export function getSearchGroupKey(
  variantNumber: string,
  variantLabel: string,
  variantType?: string
): string {
  const foil = isFoilVariant(variantNumber, variantLabel, variantType);
  if (!foil && variantLabel !== 'Standard') {
    return variantNumber;
  }
  let key = variantNumber.replace(/-Foil$/i, '');
  // Rune-style foil siblings (e.g. SFD-R05a) share a finish family with the base number.
  if (foil && key === variantNumber && variantLabel === 'Foil') {
    key = variantNumber.replace(/[a-z]$/i, '');
  }
  return key;
}

export type VariantLike = {
  variantNumber: string;
  variantLabel: string;
  variantType?: string;
};

/** Keep foil + non-foil of the same printing; exclude alternate art / promo / overnumbered rows. */
export function getSearchGroupVariants<T extends VariantLike>(
  variants: T[],
  anchor: VariantLike
): T[] {
  const key = getSearchGroupKey(
    anchor.variantNumber,
    anchor.variantLabel,
    anchor.variantType
  );
  return variants.filter(
    (variant) =>
      getSearchGroupKey(
        variant.variantNumber,
        variant.variantLabel,
        variant.variantType
      ) === key
  );
}

export type VariantFamily<T extends VariantLike = VariantLike> = {
  key: string;
  label: string;
  representativeVariantNumber: string;
  variants: T[];
};

export function sortVariantFamilies<T extends { label: string }>(families: T[]): T[] {
  return [...families].sort((a, b) => {
    if (a.label === 'Standard') return -1;
    if (b.label === 'Standard') return 1;
    return a.label.localeCompare(b.label);
  });
}

export function groupPrintingsBySearchGroup(
  printings: CardListPrinting[]
): CardListPrinting[][] {
  const groups = new Map<string, CardListPrinting[]>();

  for (const printing of printings) {
    const key = getSearchGroupKey(printing.variantNumber, printing.variantLabel);
    const group = groups.get(key) ?? [];
    group.push(printing);
    groups.set(key, group);
  }

  return [...groups.values()].map(sortPrintings);
}

export function getVariantFamiliesFromPrintings(
  printings: CardListPrinting[]
): VariantFamily<CardListPrinting>[] {
  return sortVariantFamilies(
    groupPrintingsBySearchGroup(printings).map((group) => {
      const primary = group.find((p) => !p.isFoil) ?? group[0]!;
      const label = primary.variantLabel !== 'Standard' ? primary.variantLabel : 'Standard';
      return {
        key: getSearchGroupKey(primary.variantNumber, primary.variantLabel),
        label,
        representativeVariantNumber: primary.variantNumber,
        variants: group,
      };
    })
  );
}

export function getVariantFamiliesFromCardVariants<T extends VariantLike>(
  variants: T[]
): VariantFamily<T>[] {
  const groups = new Map<string, T[]>();

  for (const variant of variants) {
    const key = getSearchGroupKey(
      variant.variantNumber,
      variant.variantLabel,
      variant.variantType
    );
    const group = groups.get(key) ?? [];
    group.push(variant);
    groups.set(key, group);
  }

  return sortVariantFamilies(
    [...groups.entries()].map(([, group]) => {
      const primary =
        group.find(
          (variant) =>
            !isFoilVariant(
              variant.variantNumber,
              variant.variantLabel,
              variant.variantType
            )
        ) ?? group[0]!;
      const label =
        primary.variantLabel !== 'Standard' ? primary.variantLabel : 'Standard';
      return {
        key: getSearchGroupKey(
          primary.variantNumber,
          primary.variantLabel,
          primary.variantType
        ),
        label,
        representativeVariantNumber: primary.variantNumber,
        variants: group,
      };
    })
  );
}

export function getPrintingsInSearchGroup(
  printings: CardListPrinting[],
  anchorVariantNumber: string
): CardListPrinting[] {
  const anchor = printings.find((p) =>
    variantNumbersMatch(p.variantNumber, anchorVariantNumber)
  );
  if (!anchor) {
    const families = getVariantFamiliesFromPrintings(printings);
    return families[0]?.variants ?? printings;
  }
  return getSearchGroupVariants(printings, anchor);
}

export function cardListItemMatchesVariant(
  card: Pick<CardListItem, 'variantNumber' | 'printings'>,
  variantNumber: string | null | undefined
): boolean {
  if (!variantNumber) return false;
  if (variantNumbersMatch(card.variantNumber, variantNumber)) return true;
  return (card.printings ?? []).some((p) =>
    variantNumbersMatch(p.variantNumber, variantNumber)
  );
}

/** Merge foil + non-foil rows that share the same base printing. */
export function groupCardListItems(items: CardListItem[]): CardListItem[] {
  const groups = new Map<string, CardListItem>();

  for (const item of items) {
    const printing = getCardPrintings(item)[0];
    if (!printing) continue;

    const key = `${item.cardId}:${getSearchGroupKey(
      printing.variantNumber,
      printing.variantLabel
    )}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        ...item,
        printings: [...getCardPrintings(item)],
      });
      continue;
    }

    for (const row of getCardPrintings(item)) {
      const already = existing.printings.some(
        (p) => p.variantNumber === row.variantNumber
      );
      if (!already) existing.printings.push(row);
    }
  }

  return Array.from(groups.values()).map((item) => {
    const printings = sortPrintings(item.printings);
    const primary = printings.find((p) => !p.isFoil) ?? printings[0];
    if (!primary) return item;

    return {
      ...item,
      variantNumber: primary.variantNumber,
      cardmarketId: item.cardmarketId,
      priceEur: primary.priceEur,
      printings,
    };
  });
}

/** Merge all variant rows that belong to the same logical card. */
export function groupCatalogListItems(items: CardListItem[]): CardListItem[] {
  const groups = new Map<
    string,
    { printings: CardListPrinting[]; rows: CardListItem[] }
  >();

  for (const item of items) {
    const existing = groups.get(item.cardId);
    if (!existing) {
      groups.set(item.cardId, {
        printings: [...getCardPrintings(item)],
        rows: [item],
      });
      continue;
    }

    existing.rows.push(item);
    for (const row of getCardPrintings(item)) {
      const already = existing.printings.some(
        (p) => p.variantNumber === row.variantNumber
      );
      if (!already) existing.printings.push(row);
    }
  }

  return Array.from(groups.values()).map(({ printings, rows }) => {
    const sorted = sortPrintings(printings);
    const primary = sorted.find((p) => !p.isFoil) ?? sorted[0];
    const base =
      rows.find((r) => r.variantNumber === primary?.variantNumber) ?? rows[0];
    return {
      ...base,
      variantNumber: primary?.variantNumber ?? base.variantNumber,
      priceEur: primary?.priceEur ?? base.priceEur,
      printings: sorted,
    };
  });
}

export type VariantPriceLike = {
  market: number | null;
  low: number | null;
  isFoil: boolean;
  avg7d?: number | null;
};

export type VariantIdentity = {
  variantNumber: string;
  variantLabel: string;
  variantType?: string;
};

/** Match Cardmarket finish to catalog variant — foil fallback when only one guide exists. */
export function pickVariantDisplayPrice<T extends VariantPriceLike>(
  prices: readonly T[],
  variant: VariantIdentity
): T | null {
  if (prices.length === 0) return null;

  const isFoil = isFoilVariant(
    variant.variantNumber,
    variant.variantLabel,
    variant.variantType
  );
  const rowsWithMarket = prices.filter((row) => row.market != null);
  const matching = rowsWithMarket.find((row) => row.isFoil === isFoil);
  if (matching) return matching;
  if (rowsWithMarket.length === 1) return rowsWithMarket[0] ?? null;
  return prices.find((row) => !row.isFoil) ?? rowsWithMarket[0] ?? prices[0] ?? null;
}

export function toPriceEurSummary(
  price: VariantPriceLike | null | undefined
): CardListItem['priceEur'] {
  if (!price || price.market == null) return null;
  return {
    currency: 'EUR',
    low: price.low,
    market: price.market,
    avg7d: price.avg7d ?? null,
    isFoil: price.isFoil,
  };
}

function priceAmount(price: CardListItem['priceEur']): number | null {
  if (!price) return null;
  return price.market ?? null;
}

/** Highest Cardmarket trend across a card row and all of its printings. */
export function getCardMaxMarketPrice(card: CardListItem): number {
  const printings = getCardPrintings(card);
  let max = priceAmount(card.priceEur) ?? 0;
  for (const printing of printings) {
    const amount = priceAmount(printing.priceEur);
    if (amount != null && amount > max) max = amount;
  }
  return max;
}

export function formatListPrice(card: CardListItem): string | null {
  const printings = getCardPrintings(card);
  let min: number | null = null;
  let max: number | null = null;

  for (const p of printings) {
    const amount = priceAmount(p.priceEur);
    if (amount == null) continue;
    if (min == null || amount < min) min = amount;
    if (max == null || amount > max) max = amount;
  }

  if (min == null || max == null) {
    const single = priceAmount(card.priceEur);
    return single != null ? `€${single.toFixed(2)}` : null;
  }

  if (min === max) return `€${min.toFixed(2)}`;
  return `€${min.toFixed(2)}–${max.toFixed(2)}`;
}

export function printingSummary(card: CardListItem): string | null {
  const printings = getCardPrintings(card);
  if (!hasMultiplePrintings(printings)) return null;
  let hasFoil = false;
  let hasStd = false;
  for (const p of printings) {
    if (p.isFoil) hasFoil = true;
    else hasStd = true;
  }
  const parts: string[] = [];
  if (hasStd) parts.push('Std');
  if (hasFoil) parts.push('Foil');
  return parts.join(' · ');
}

export function formatPrintingPrice(
  price: CardListItem['priceEur']
): string | null {
  const amount = priceAmount(price);
  return amount != null ? `€${amount.toFixed(2)}` : null;
}

export type MarketPriceDisplay = {
  label: string;
  price: string;
};

function formatPriceRowAmount(row: { market: number | null }): string | null {
  const amount = row.market;
  return amount != null ? `€${amount.toFixed(2)}` : null;
}

/** Show only prices relevant to this printing — not every Cardmarket finish on the product id. */
export function getVariantMarketPriceDisplays(variant: {
  variantNumber: string;
  variantLabel: string;
  variantType: string;
  prices: { market: number | null; low: number | null; isFoil: boolean }[];
}): MarketPriceDisplay[] {
  const isFoil = isFoilVariant(
    variant.variantNumber,
    variant.variantLabel,
    variant.variantType
  );
  const label = formatPrintingLabel(
    variant.variantLabel,
    isFoil,
    variant.variantNumber
  );

  const matching = pickVariantDisplayPrice(variant.prices, variant);
  if (!matching) return [];

  const price = formatPriceRowAmount(matching);
  return price ? [{ label, price }] : [];
}

/** Derive a week-over-week style trend label from market vs avg7d. */
export function formatMarketTrend(
  price: CardListItem['priceEur']
): string {
  if (!price?.market || !price.avg7d) return 'Flat';
  const { changePercent, trend } = computeTrend(price.market, price.avg7d);
  return formatTrendLabel(changePercent, trend);
}

export function bestCardTrend(card: CardListItem): string {
  const printings = getCardPrintings(card);
  const trends = printings.map((p) => formatMarketTrend(p.priceEur));
  const up = trends.filter((t) => t.startsWith('+'));
  const down = trends.filter((t) => t.startsWith('-'));
  if (up.length > 0) return up[0];
  if (down.length > 0) return down[0];
  return trends[0] ?? 'Flat';
}

export function totalOwnedForCard(
  card: CardListItem,
  collectionByVariant?: ReadonlyMap<string, { quantity: number }>
): number {
  if (!collectionByVariant) return 0;
  return getCardPrintings(card).reduce(
    (sum, p) => sum + (collectionByVariant.get(p.variantNumber)?.quantity ?? 0),
    0
  );
}
