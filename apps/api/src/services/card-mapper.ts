import type {
  CardListItem,
  CardListPrinting,
  CardDetail,
  PriceSummary,
  VariantDetail,
} from '@riftbound/contracts';
import {
  isCardBannedAt,
  isVariantFoil,
  variantOffersDualFinishes,
} from '@riftbound/contracts';
import type { PaLogicalCard, PaPriceRow, PaVariant } from '@riftbound/contracts';
import { entityHash } from '../lib/hash.js';

function parseDecimal(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** @deprecated Prefer isVariantFoil with foilMode — kept for call sites that lack mode. */
export function isFoilVariant(
  variantNumber: string,
  variantLabel?: string,
  variantType?: string
): boolean {
  return isVariantFoil(undefined, variantNumber, variantLabel, variantType);
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

function hasUsableTrend(row: PriceSummary): boolean {
  return row.market != null && row.market > 0;
}

function pickDisplayPrice(rows: PriceSummary[], isFoil: boolean): PriceSummary | null {
  if (rows.length === 0) return null;

  const rowsWithTrend = rows.filter(hasUsableTrend);
  const matching = rowsWithTrend.find((row) => row.isFoil === isFoil);
  if (matching) return matching;

  // Showcase / signed printings often only have foil trend data in Cardmarket's guide.
  const foilTrend = rowsWithTrend.find((row) => row.isFoil);
  if (foilTrend) return foilTrend;

  const plainTrend = rowsWithTrend.find((row) => !row.isFoil);
  if (plainTrend) return plainTrend;

  const rowsWithLow = rows.filter((row) => row.low != null);
  return (
    rowsWithLow.find((row) => row.isFoil === isFoil) ??
    rowsWithLow.find((row) => row.isFoil) ??
    rowsWithLow[0] ??
    null
  );
}

function printingLabel(isFoil: boolean, variantLabel: string): string {
  if (isFoil) {
    if (variantLabel && variantLabel !== 'Standard' && !/foil/i.test(variantLabel)) {
      return variantLabel;
    }
    return 'Foil';
  }
  return variantLabel || 'Standard';
}

function toPrinting(
  variant: PaVariant,
  isFoil: boolean,
  priceRows: PaPriceRow[]
): CardListPrinting {
  const cmId = variant.cardmarketId ?? null;
  const variantPrices = cmId ? mapPriceRows(priceRows, cmId) : [];
  return {
    variantNumber: variant.variantNumber,
    variantLabel: printingLabel(isFoil, variant.variantLabel),
    isFoil,
    foilMode: variant.foilMode,
    priceEur: pickDisplayPrice(variantPrices, isFoil),
  };
}

/** Emit one or two finish printings for a catalog variant row. */
export function printingsForVariant(
  variant: PaVariant,
  priceRows: PaPriceRow[] = []
): CardListPrinting[] {
  if (
    variantOffersDualFinishes(
      variant.foilMode,
      variant.variantNumber,
      variant.variantLabel,
      variant.variantType
    )
  ) {
    return [
      toPrinting(variant, false, priceRows),
      toPrinting(variant, true, priceRows),
    ];
  }
  const isFoil = isVariantFoil(
    variant.foilMode,
    variant.variantNumber,
    variant.variantLabel,
    variant.variantType
  );
  return [toPrinting(variant, isFoil, priceRows)];
}

/**
 * When a real `-Foil` sibling is present, drop same-VN synthetic foil finishes
 * produced from `foilMode=both` on the standard SKU.
 */
export function dedupeFinishPrintings(
  printings: CardListPrinting[]
): CardListPrinting[] {
  const hasDistinctFoilSibling = printings.some(
    (p) =>
      p.isFoil &&
      printings.some((o) => !o.isFoil && o.variantNumber !== p.variantNumber)
  );

  const filtered = hasDistinctFoilSibling
    ? printings.filter(
        (p) =>
          !(
            p.isFoil &&
            printings.some((o) => !o.isFoil && o.variantNumber === p.variantNumber)
          )
      )
    : printings;

  const seen = new Set<string>();
  const result: CardListPrinting[] = [];
  for (const printing of filtered) {
    const key = `${printing.variantNumber}\0${printing.isFoil ? '1' : '0'}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(printing);
  }
  return result;
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

function mapVariantDetail(variant: PaVariant, priceRows: PaPriceRow[]): VariantDetail {
  const cmId = variant.cardmarketId ?? null;
  return {
    id: variant.id,
    variantNumber: variant.variantNumber,
    rarity: variant.rarity,
    variantType: variant.variantType,
    variantLabel: variant.variantLabel,
    foilMode: variant.foilMode,
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
  const printings = printingsForVariant(primaryVariant, priceRows);
  const primary = printings.find((p) => !p.isFoil) ?? printings[0]!;
  const cmId = primaryVariant.cardmarketId ?? null;

  return {
    cardId: card.id,
    variantNumber: primary.variantNumber,
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
    priceEur: primary.priceEur,
    printings,
    isBanned: isCardBannedAt(card.banEffectiveDate ?? null),
  };
}

/** Search rows only merge a standard printing with its foil finish — not alternates or overnumbered art. */
export function getSearchGroupKey(
  variantNumber: string,
  variantLabel: string,
  variantType?: string,
  foilMode?: string
): string {
  const foil = isVariantFoil(foilMode, variantNumber, variantLabel, variantType);
  if (!foil && variantLabel !== 'Standard' && variantLabel !== 'Foil') {
    return variantNumber;
  }
  let key = variantNumber.replace(/-Foil$/i, '');
  // Rune foil siblings use a trailing letter instead of `-Foil` (SFD-R05a).
  if (foil && key === variantNumber && variantLabel === 'Foil') {
    key = variantNumber.replace(/[a-z]$/i, '');
  }
  return key;
}

/** Merge foil + non-foil rows that share the same base printing. */
export function groupCardListItems(items: CardListItem[]): CardListItem[] {
  const groups = new Map<string, CardListItem>();

  for (const item of items) {
    const printings = item.printings.length > 0 ? item.printings : [];
    if (printings.length === 0) continue;

    for (const printing of printings) {
      const key = `${item.cardId}:${getSearchGroupKey(
        printing.variantNumber,
        printing.variantLabel,
        undefined,
        printing.foilMode
      )}`;
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, {
          ...item,
          variantNumber: printing.variantNumber,
          priceEur: printing.priceEur,
          printings: [printing],
        });
        continue;
      }

      existing.isBanned = existing.isBanned || item.isBanned;
      existing.printings.push(printing);
    }
  }

  return Array.from(groups.values()).map((item) => {
    const printings = sortPrintings(dedupeFinishPrintings(item.printings));
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
      existing.printings.push(row);
    }
  }

  return Array.from(groups.values()).map(({ printings, rows }) => {
    const sorted = sortPrintings(dedupeFinishPrintings(printings));
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
