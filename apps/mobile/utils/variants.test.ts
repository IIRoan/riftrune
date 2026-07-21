import { describe, expect, test } from 'bun:test';
import { getSearchGroupKey, getSearchGroupVariants, getVariantFamiliesFromPrintings, getVariantMarketPriceDisplays, getPrintingsInSearchGroup, pickVariantDisplayPrice } from '@/utils/variants';

describe('getSearchGroupVariants', () => {
  const dariusVariants = [
    { variantNumber: 'OGN-253', variantLabel: 'Standard', variantType: 'standard' },
    { variantNumber: 'OGN-253-Foil', variantLabel: 'Standard', variantType: 'foil' },
    {
      variantNumber: 'OGN-253-Release',
      variantLabel: 'Release Event Promo',
      variantType: 'promo',
    },
    { variantNumber: 'OGN-302', variantLabel: 'Overnumbered', variantType: 'overnumbered' },
    {
      variantNumber: 'OGN-302*',
      variantLabel: 'Overnumbered Signed',
      variantType: 'signed',
    },
  ];

  test('standard Darius detail shows only foil and non-foil standard printings', () => {
    const anchor = dariusVariants[0]!;
    const group = getSearchGroupVariants(dariusVariants, anchor);

    expect(group.map((v) => v.variantNumber)).toEqual(['OGN-253', 'OGN-253-Foil']);
  });

  test('release promo detail excludes other variant types', () => {
    const anchor = dariusVariants[2]!;
    const group = getSearchGroupVariants(dariusVariants, anchor);

    expect(group.map((v) => v.variantNumber)).toEqual(['OGN-253-Release']);
  });

  test('overnumbered detail excludes standard and signed rows', () => {
    const anchor = dariusVariants[3]!;
    const group = getSearchGroupVariants(dariusVariants, anchor);

    expect(group.map((v) => v.variantNumber)).toEqual(['OGN-302']);
  });

  test('getSearchGroupKey treats foil suffix as same group as standard', () => {
    expect(getSearchGroupKey('OGN-253', 'Standard')).toBe('OGN-253');
    expect(getSearchGroupKey('OGN-253-Foil', 'Standard', 'foil')).toBe('OGN-253');
    expect(getSearchGroupKey('OGN-253-Release', 'Release Event Promo')).toBe(
      'OGN-253-Release'
    );
  });

  test('getSearchGroupKey groups rune-style foil siblings with their base printing', () => {
    expect(getSearchGroupKey('SFD-R05', 'Standard')).toBe('SFD-R05');
    expect(getSearchGroupKey('SFD-R05a', 'Foil')).toBe('SFD-R05');
  });
});

describe('pickVariantDisplayPrice', () => {
  test('falls back to foil guide for foil-only signed printings', () => {
    const row = pickVariantDisplayPrice(
      [{ market: 2547.93, low: 2499.95, isFoil: true }],
      {
        variantNumber: 'SFD-227*',
        variantLabel: 'Showcase',
        variantType: 'Overnumbered Signed',
      }
    );
    expect(row?.market).toBe(2547.93);
  });
});

describe('getVariantMarketPriceDisplays', () => {
  test('shows only the non-foil price for a single-finish showcase printing', () => {
    const rows = getVariantMarketPriceDisplays({
      variantNumber: 'OGN-302*',
      variantLabel: 'Overnumbered Signed',
      variantType: 'signed',
      prices: [
        { market: 325, low: 300, isFoil: false },
        { market: 378.34, low: 350, isFoil: true },
      ],
    });

    expect(rows).toEqual([{ label: 'Overnumbered Signed', price: '€325.00' }]);
  });

  test('shows only the foil price for a foil-only promo', () => {
    const rows = getVariantMarketPriceDisplays({
      variantNumber: 'ARC-002',
      variantLabel: 'Arcane Box Promo Foil',
      variantType: 'foil',
      prices: [
        { market: 45.43, low: 40, isFoil: true },
        { market: 30, low: 28, isFoil: false },
      ],
    });

    expect(rows).toEqual([{ label: 'Arcane Box Promo Foil', price: '€45.43' }]);
  });
});

describe('getVariantFamiliesFromPrintings', () => {
  const daringPoroPrintings = [
    { variantNumber: 'OGN-210', variantLabel: 'Standard', isFoil: false, priceEur: null },
    { variantNumber: 'OGN-210-Foil', variantLabel: 'Standard', isFoil: true, priceEur: null },
    {
      variantNumber: 'OGN-210-Nexus',
      variantLabel: 'Nexus Night Promo',
      isFoil: false,
      priceEur: null,
    },
    {
      variantNumber: 'OGN-210-ON',
      variantLabel: 'Overnumbered',
      isFoil: false,
      priceEur: null,
    },
  ];

  test('groups catalog printings into std/foil families', () => {
    const families = getVariantFamiliesFromPrintings(daringPoroPrintings);

    expect(families.map((family) => family.label)).toEqual([
      'Standard',
      'Nexus Night Promo',
      'Overnumbered',
    ]);
    expect(families[0]?.variants.map((p) => p.variantNumber)).toEqual([
      'OGN-210',
      'OGN-210-Foil',
    ]);
  });

  test('getPrintingsInSearchGroup returns only the active family', () => {
    const scoped = getPrintingsInSearchGroup(daringPoroPrintings, 'OGN-210-ON');

    expect(scoped.map((p) => p.variantNumber)).toEqual(['OGN-210-ON']);
  });
});
