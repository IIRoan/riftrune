import { describe, expect, test } from 'bun:test';
import {
  baseVariantNumberForCardmarket,
  resolveCardmarketIdFromMap,
} from '../../src/lib/variant-cardmarket.js';

describe('baseVariantNumberForCardmarket', () => {
  test('strips a distinct -Foil SKU suffix', () => {
    expect(baseVariantNumberForCardmarket('SFD-001-Foil')).toBe('SFD-001');
    expect(baseVariantNumberForCardmarket('ogn-001-foil')).toBe('ogn-001');
  });

  test('returns null when there is no foil sibling suffix', () => {
    expect(baseVariantNumberForCardmarket('SFD-001')).toBeNull();
    expect(baseVariantNumberForCardmarket('SFD-R05a')).toBeNull();
  });
});

describe('resolveCardmarketIdFromMap', () => {
  test('uses the variant id when present', () => {
    const map = new Map<string, number | null>([
      ['sfd-001', 866723],
      ['sfd-001-foil', 999],
    ]);
    expect(resolveCardmarketIdFromMap('SFD-001-Foil', map)).toBe(999);
  });

  test('falls back to the base printing when the foil SKU has no id', () => {
    const map = new Map<string, number | null>([
      ['sfd-001', 866723],
      ['sfd-001-foil', null],
    ]);
    expect(resolveCardmarketIdFromMap('SFD-001-Foil', map)).toBe(866723);
  });

  test('returns null when neither the foil SKU nor its base is mapped', () => {
    expect(resolveCardmarketIdFromMap('SFD-001-Foil', new Map())).toBeNull();
  });
});
