import type { CardListItem, CardListPrinting, CardsListResponse } from '@riftbound/contracts';

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

function priceAmount(price: CardListItem['priceEur']): number | null {
  if (!price) return null;
  return price.market ?? price.low ?? null;
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

/** Derive a week-over-week style trend label from market vs avg7d. */
export function formatMarketTrend(
  price: CardListItem['priceEur']
): string {
  if (!price?.market || !price.avg7d || price.avg7d === 0) return 'Flat';
  const pct = Math.round(((price.market - price.avg7d) / price.avg7d) * 100);
  if (pct >= 5) return `+${String(pct)}%`;
  if (pct <= -5) return `${String(pct)}%`;
  return 'Flat';
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
