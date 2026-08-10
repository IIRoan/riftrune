import { describe, expect, test } from 'bun:test';
import {
  catalogDrawDistance,
  catalogLookaheadCount,
  isFastCatalogScroll,
} from '@/lib/catalog-page-size';

describe('catalogDrawDistance', () => {
  test('keeps at least 900px of draw buffer', () => {
    expect(catalogDrawDistance(320)).toBeGreaterThanOrEqual(900);
  });

  test('scales with taller viewports', () => {
    expect(catalogDrawDistance(800)).toBe(1200);
  });
});

describe('catalogLookaheadCount', () => {
  test('warms multiple grid rows ahead at rest', () => {
    expect(catalogLookaheadCount('grid', 3, 0)).toBe(24);
  });

  test('expands lookahead on fast scroll', () => {
    expect(isFastCatalogScroll(0.55)).toBe(true);
    expect(catalogLookaheadCount('grid', 3, 0.55)).toBe(42);
    expect(catalogLookaheadCount('list', 1, 0.55)).toBe(48);
  });
});
