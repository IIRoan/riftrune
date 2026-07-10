import type {
  CardListItem,
  CardListPrinting,
  CardDetail,
  PriceSummary,
  VariantDetail,
} from '@riftbound/contracts';
import { isCardBannedAt } from '@riftbound/contracts';
import type { PaLogicalCard, PaPriceRow, PaVariant } from '@riftbound/contracts';
import { entityHash } from '../lib/hash.js';

function parseDecimal(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

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

export function mapPriceRows(rows: PaPriceRow[], cardmarketId: number): PriceSummary[] {
  return rows
    .filter((r) => r.cardmarketId === cardmarketId)
    .map((r) => ({
      currency: 'EUR' as const,
      low: parseDecimal(r.lowPrice),
      market: parseDecimal(r.marketPrice),
      avg7d: parseDecimal(r.avg7Day),
      isFoil: r.isFoil,
    }));
}

function pickDisplayPrice(rows: PriceSummary[]): PriceSummary | null {
  return rows.find((p) => !p.isFoil) ?? rows[0] ?? null;
}

export function mapCardDetail(
  card: PaLogicalCard,
  priceRows: PaPriceRow[] = []
): CardDetail {
  return {
    id: card.id,
    name: card.name,
    type: card.type,
    super: card.super ?? null,
    description: card.description,
    energy: card.energy,
    might: card.might,
    power: card.power,
    tags: card.tags,
    colors: card.colors.map((c) => ({
      id: c.id,
      name: c.name,
      hexCode: c.hexCode,
      imageUrl: c.imageUrl,
    })),
    variants: card.variants.map((v) => mapVariantDetail(v, priceRows)),
    banEffectiveDate: card.banEffectiveDate ?? null,
  };
}

function mapVariantDetail(
  variant: PaVariant,
  priceRows: PaPriceRow[]
): VariantDetail {
  const cmId = variant.cardmarketId ?? null;
  return {
    id: variant.id,
    variantNumber: variant.variantNumber,
    rarity: variant.rarity,
    variantType: variant.variantType,
    variantLabel: variant.variantLabel,
    imageUrl: variant.imageUrl,
    cardmarketId: cmId,
    tcgplayerId: variant.tcgplayerId ?? null,
    releaseDate: variant.releaseDate ?? null,
    artist: variant.artist ?? null,
    prices: cmId ? mapPriceRows(priceRows, cmId) : [],
  };
}

export function mapListItem(
  card: PaLogicalCard,
  primaryVariant: PaVariant,
  priceRows: PaPriceRow[] = []
): CardListItem {
  const cmId = primaryVariant.cardmarketId ?? null;
  const variantPrices = cmId ? mapPriceRows(priceRows, cmId) : [];
  const displayPrice = pickDisplayPrice(variantPrices);
  const isFoil = isFoilVariant(
    primaryVariant.variantNumber,
    primaryVariant.variantLabel,
    primaryVariant.variantType
  );

  const printing: CardListPrinting = {
    variantNumber: primaryVariant.variantNumber,
    variantLabel: primaryVariant.variantLabel,
    isFoil,
    priceEur: displayPrice,
  };

  return {
    cardId: card.id,
    variantNumber: primaryVariant.variantNumber,
    name: card.name,
    type: card.type,
    super: card.super ?? null,
    variantType: primaryVariant.variantType,
    energy: card.energy,
    might: card.might,
    power: card.power,
    rarity: primaryVariant.rarity,
    setCode: primaryVariant.set.prefix,
    colors: card.colors.map((c) => c.name),
    imageUrl: primaryVariant.imageUrl,
    cardmarketId: cmId,
    priceEur: displayPrice,
    printings: [printing],
    isBanned: isCardBannedAt(card.banEffectiveDate ?? null),
  };
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
  return variantNumber.replace(/-Foil$/i, '');
}

/** Merge foil + non-foil rows that share the same base printing. */
export function groupCardListItems(items: CardListItem[]): CardListItem[] {
  const groups = new Map<string, CardListItem>();

  for (const item of items) {
    const printing = item.printings[0];
    if (!printing) continue;

    const key = `${item.cardId}:${getSearchGroupKey(
      printing.variantNumber,
      printing.variantLabel
    )}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        ...item,
        printings: [...item.printings],
      });
      continue;
    }

    existing.isBanned = existing.isBanned || item.isBanned;

    for (const row of item.printings) {
      const already = existing.printings.some(
        (p) => p.variantNumber === row.variantNumber
      );
      if (!already) existing.printings.push(row);
    }
  }

  return Array.from(groups.values()).map((item) => {
    const printings = [...item.printings].sort((a, b) => {
      if (a.isFoil !== b.isFoil) return a.isFoil ? 1 : -1;
      return a.variantNumber.localeCompare(b.variantNumber);
    });
    const primary = printings.find((p) => !p.isFoil) ?? printings[0];
    if (!primary) return item;

    return {
      ...item,
      variantNumber: primary.variantNumber,
      cardmarketId: item.cardmarketId,
      priceEur: primary.priceEur,
      printings,
      isBanned: item.isBanned,
    };
  });
}

function sortPrintings(printings: CardListPrinting[]): CardListPrinting[] {
  return [...printings].sort((a, b) => {
    if (a.isFoil !== b.isFoil) return a.isFoil ? 1 : -1;
    return a.variantNumber.localeCompare(b.variantNumber);
  });
}

function pickPrimaryPrinting(printings: CardListPrinting[]): CardListPrinting {
  if (printings.length === 0) {
    throw new Error('Cannot pick primary printing from empty list');
  }
  return printings.find((p) => !p.isFoil) ?? printings[0]!;
}

/** Merge all variant rows that belong to the same logical card (catalog grid rows). */
export function groupCatalogListItems(items: CardListItem[]): CardListItem[] {
  const groups = new Map<
    string,
    { printings: CardListPrinting[]; rows: CardListItem[] }
  >();

  for (const item of items) {
    const existing = groups.get(item.cardId);
    if (!existing) {
      groups.set(item.cardId, {
        printings: [...item.printings],
        rows: [item],
      });
      continue;
    }

    existing.rows.push(item);
    for (const row of item.printings) {
      const already = existing.printings.some(
        (p) => p.variantNumber === row.variantNumber
      );
      if (!already) existing.printings.push(row);
    }
  }

  return Array.from(groups.values()).map(({ printings, rows }) => {
    const sorted = sortPrintings(printings);
    const primary = pickPrimaryPrinting(sorted);
    const base =
      rows.find((r) => r.variantNumber === primary.variantNumber) ?? rows[0]!;
    return {
      ...base,
      type: base.type,
      variantNumber: primary.variantNumber,
      priceEur: primary.priceEur,
      printings: sorted,
    };
  });
}

export function paCardHash(card: PaLogicalCard): string {
  return entityHash(card);
}

export function paVariantHash(variant: PaVariant): string {
  return entityHash(variant);
}

export function paPriceHash(row: PaPriceRow): string {
  return entityHash(row);
}
