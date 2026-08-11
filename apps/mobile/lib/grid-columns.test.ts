import { describe, expect, test } from 'bun:test';
import { Layout } from '@/constants/Layout';
import {
  GRID_TILE_MAX_WIDTH,
  GRID_TILE_MIN_WIDTH,
  computeMaxCappedGridColumns,
} from '@/lib/grid-columns';

const gap = Layout.gridGap;

function tileWidthFor(available: number, columns: number) {
  return (available - gap * (columns - 1)) / columns;
}

describe('computeMaxCappedGridColumns', () => {
  test('keeps phone-width catalogs around 3 columns under the max tile size', () => {
    const available = 390;
    const columns = computeMaxCappedGridColumns(available, gap);
    expect(columns).toBe(3);
    expect(tileWidthFor(available, columns)).toBeLessThanOrEqual(GRID_TILE_MAX_WIDTH);
    expect(tileWidthFor(available, columns)).toBeGreaterThanOrEqual(GRID_TILE_MIN_WIDTH);
  });

  test('adds columns on tablet widths instead of stretching past the max', () => {
    const available = 768;
    const columns = computeMaxCappedGridColumns(available, gap);
    expect(columns).toBeGreaterThanOrEqual(5);
    expect(tileWidthFor(available, columns)).toBeLessThanOrEqual(GRID_TILE_MAX_WIDTH);
  });

  test('keeps growing on large tablet / narrow-desktop widths', () => {
    const available = 1000;
    const columns = computeMaxCappedGridColumns(available, gap);
    expect(columns).toBeGreaterThanOrEqual(6);
    expect(tileWidthFor(available, columns)).toBeLessThanOrEqual(GRID_TILE_MAX_WIDTH);
  });

  test('does not drop below two columns on very narrow widths', () => {
    expect(computeMaxCappedGridColumns(200, gap)).toBe(2);
  });
});
