import { describe, expect, test } from 'bun:test';
import {
  collectionFinishKey,
  isExplicitFoilVariant,
  isVariantFoil,
  normalizeFoilMode,
  parseCollectionFinishKey,
  variantOffersDualFinishes,
} from './foil.js';

describe('normalizeFoilMode', () => {
  test('normalizes known modes', () => {
    expect(normalizeFoilMode('both')).toBe('both');
    expect(normalizeFoilMode('FOIL_ONLY')).toBe('foil_only');
    expect(normalizeFoilMode('nonfoil_only')).toBe('nonfoil_only');
    expect(normalizeFoilMode('None')).toBe('nonfoil_only');
    expect(normalizeFoilMode('')).toBe('unknown');
  });
});

describe('isExplicitFoilVariant', () => {
  test('detects foil from number, label, or type', () => {
    expect(isExplicitFoilVariant('OGN-001-Foil')).toBe(true);
    expect(isExplicitFoilVariant('OGN-001', 'Foil')).toBe(true);
    expect(isExplicitFoilVariant('OGN-001', 'Standard', 'Foil Finish')).toBe(true);
    expect(isExplicitFoilVariant('OGN-001', 'Standard')).toBe(false);
  });
});

describe('isVariantFoil', () => {
  test('treats foil_only as foil even without foil in the label', () => {
    expect(isVariantFoil('foil_only', 'OGN-025', 'Standard', 'Standard')).toBe(true);
    expect(isVariantFoil('foil_only', 'ARC-002', 'Arcane Box Promo', 'Promo')).toBe(
      true
    );
  });

  test('does not treat both as foil by itself', () => {
    expect(isVariantFoil('both', 'VEN-074', 'Standard', 'Standard')).toBe(false);
  });

  test('treats explicit foil siblings as foil under both', () => {
    expect(isVariantFoil('both', 'OGN-001-Foil', 'Foil', 'Standard')).toBe(true);
  });
});

describe('variantOffersDualFinishes', () => {
  test('true only for both without explicit foil sibling', () => {
    expect(variantOffersDualFinishes('both', 'VEN-074', 'Standard', 'Standard')).toBe(
      true
    );
    expect(variantOffersDualFinishes('both', 'OGN-001-Foil', 'Foil', 'Standard')).toBe(
      false
    );
    expect(
      variantOffersDualFinishes('foil_only', 'OGN-025', 'Standard', 'Standard')
    ).toBe(false);
  });
});

describe('collectionFinishKey', () => {
  test('round-trips through parse', () => {
    const key = collectionFinishKey('VEN-074', true);
    expect(key).toBe('VEN-074::foil');
    expect(parseCollectionFinishKey(key)).toEqual({
      variantNumber: 'VEN-074',
      isFoil: true,
    });
    expect(parseCollectionFinishKey(collectionFinishKey('OGN-001', false))).toEqual({
      variantNumber: 'OGN-001',
      isFoil: false,
    });
  });
});
