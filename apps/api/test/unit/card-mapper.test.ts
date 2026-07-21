import { describe, expect, test } from 'bun:test';
import { PaLogicalCard } from '@riftbound/contracts';
import {
  getSearchGroupKey,
  groupCardListItems,
  groupCatalogListItems,
  isFoilVariant,
  mapCardDetail,
  mapListItem,
  mapPriceRows,
  paCardHash,
  paVariantHash,
} from '../../src/services/card-mapper.js';

const CARD_ID = '7596dc74-82bc-41ac-a25f-83f4b98ffb72';
const SET_ID = '4583bc2e-da65-492f-97dc-4876988048d7';
const VARIANT_STANDARD_ID = '0cd819d5-a03f-45d2-9e65-aec8ddae735e';
const VARIANT_FOIL_ID = '1cd819d5-a03f-45d2-9e65-aec8ddae735f';
const VARIANT_ALT_ID = '2cd819d5-a03f-45d2-9e65-aec8ddae7360';

function variant(
  id: string,
  variantNumber: string,
  variantLabel: string,
  variantType: string,
  cardmarketId: number
) {
  return {
    id,
    variantNumber,
    rarity: 'Rare',
    variantType,
    variantLabel,
    foilMode: 'None',
    variantTypes: [variantType],
    imageUrl: `https://example.com/${variantNumber}.webp`,
    showInLibrary: true,
    isCollectible: true,
    cardmarketId,
    set: { id: SET_ID, name: 'Origins', prefix: 'OGN' },
  };
}

const logical = PaLogicalCard.parse({
  id: CARD_ID,
  name: 'Vi Destructive',
  type: 'Unit',
  super: null,
  description: 'Test',
  energy: 2,
  might: 2,
  power: 2,
  tags: ['Piltover'],
  colors: [{ id: SET_ID, name: 'Body' }],
  banEffectiveDate: null,
  variants: [
    variant(VARIANT_STANDARD_ID, 'OGN-001', 'Standard', 'Standard', 100),
    variant(VARIANT_FOIL_ID, 'OGN-001-Foil', 'Foil', 'Standard', 100),
    variant(VARIANT_ALT_ID, 'OGN-001a', 'Alt Art', 'Alternate Art', 101),
  ],
});

const priceRows = [
  {
    cardmarketId: 100,
    isFoil: false,
    marketPrice: '1.25',
    lowPrice: '0.80',
    avg7Day: '1.10',
    lastUpdated: '2026-01-01',
  },
  {
    cardmarketId: 100,
    isFoil: true,
    marketPrice: '4.50',
    lowPrice: '3.00',
    avg7Day: '4.00',
    lastUpdated: '2026-01-01',
  },
];

describe('isFoilVariant', () => {
  test('detects foil from number, label, or type', () => {
    expect(isFoilVariant('OGN-001-Foil')).toBe(true);
    expect(isFoilVariant('OGN-001', 'Foil')).toBe(true);
    expect(isFoilVariant('OGN-001', 'Standard', 'Foil Finish')).toBe(true);
    expect(isFoilVariant('OGN-001', 'Standard')).toBe(false);
  });
});

describe('mapPriceRows', () => {
  test('filters by cardmarket id and parses decimals', () => {
    const rows = mapPriceRows(priceRows, 100);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.market).toBe(1.25);
    expect(rows[1]?.isFoil).toBe(true);
  });
});

describe('mapCardDetail', () => {
  test('maps logical card with per-variant prices', () => {
    const detail = mapCardDetail(logical, priceRows);
    expect(detail.name).toBe('Vi Destructive');
    expect(detail.variants).toHaveLength(3);
    expect(detail.variants[0]?.prices).toHaveLength(2);
    expect(detail.variants[2]?.prices).toHaveLength(0);
  });
});

describe('mapListItem', () => {
  test('picks foil-aware display price for primary variant', () => {
    const standard = mapListItem(logical, logical.variants[0]!, priceRows);
    const foil = mapListItem(logical, logical.variants[1]!, priceRows);
    expect(standard.priceEur?.market).toBe(1.25);
    expect(foil.priceEur?.market).toBe(4.5);
    expect(standard.printings[0]?.isFoil).toBe(false);
    expect(foil.printings[0]?.isFoil).toBe(true);
  });

  test('ignores zero-trend plain rows when foil guide has the real price', () => {
    const showcase = variant(
      VARIANT_ALT_ID,
      'SFD-227*',
      'Overnumbered Signed',
      'Overnumbered',
      867005
    );
    const showcaseRows = [
      {
        cardmarketId: 867005,
        isFoil: false,
        marketPrice: '0',
        lowPrice: '2499.95',
        avg7Day: null,
        lastUpdated: '2026-01-01',
      },
      {
        cardmarketId: 867005,
        isFoil: true,
        marketPrice: '2547.93',
        lowPrice: '2499.95',
        avg7Day: '2720.50',
        lastUpdated: '2026-01-01',
      },
    ];
    const item = mapListItem(
      { ...logical, variants: [showcase] },
      showcase,
      showcaseRows
    );
    expect(item.priceEur?.market).toBe(2547.93);
    expect(item.priceEur?.isFoil).toBe(true);
  });
});

describe('getSearchGroupKey', () => {
  test('groups foil with standard but keeps alternate art separate', () => {
    expect(getSearchGroupKey('OGN-001', 'Standard')).toBe('OGN-001');
    expect(getSearchGroupKey('OGN-001-Foil', 'Foil')).toBe('OGN-001');
    expect(getSearchGroupKey('OGN-001a', 'Alt Art', 'Alternate Art')).toBe('OGN-001a');
  });
});

describe('groupCardListItems', () => {
  test('merges foil and non-foil search rows', () => {
    const standard = mapListItem(logical, logical.variants[0]!, priceRows);
    const foil = mapListItem(logical, logical.variants[1]!, priceRows);
    const grouped = groupCardListItems([standard, foil]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.printings).toHaveLength(2);
    expect(grouped[0]?.variantNumber).toBe('OGN-001');
  });

  test('splits catalog-grouped rows so promo and overnumbered stay separate', () => {
    const rows = logical.variants.map((entry) => mapListItem(logical, entry, priceRows));
    const catalogGrouped = groupCatalogListItems(rows);
    expect(catalogGrouped).toHaveLength(1);

    const grouped = groupCardListItems(catalogGrouped);
    expect(grouped.length).toBeGreaterThan(1);
    for (const row of grouped) {
      const labels = new Set(row.printings.map((printing) => printing.variantLabel));
      const hasStandardFamily = [...labels].some(
        (label) => label === 'Standard' || /foil/i.test(label)
      );
      if (hasStandardFamily) {
        expect(
          row.printings.every(
            (printing) =>
              printing.variantLabel === 'Standard' || /foil/i.test(printing.variantLabel)
          )
        ).toBe(true);
      }
    }
  });
});

describe('groupCatalogListItems', () => {
  test('merges all printings for the same logical card', () => {
    const rows = logical.variants.map((entry) => mapListItem(logical, entry, priceRows));
    const grouped = groupCatalogListItems(rows);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.printings).toHaveLength(3);
    expect(grouped[0]?.variantNumber).toBe('OGN-001');
  });
});

describe('entity hashes', () => {
  test('hashes upstream card and variant payloads', () => {
    expect(paCardHash(logical)).toHaveLength(64);
    expect(paVariantHash(logical.variants[0]!)).toHaveLength(64);
  });
});
