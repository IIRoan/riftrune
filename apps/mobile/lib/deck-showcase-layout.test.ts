import { describe, expect, test } from 'bun:test';
import { computeShowcaseIdentityTileWidth } from '@/lib/deck-showcase-layout';

describe('computeShowcaseIdentityTileWidth', () => {
  test('keeps phone showcase compact when runes stack below', () => {
    // Half of a ~360px column would be ~174; clamp to mobile catalog scale.
    expect(computeShowcaseIdentityTileWidth(360, false)).toBe(120);
  });

  test('reserves rune column when runes sit beside on mid widths', () => {
    const beside = computeShowcaseIdentityTileWidth(480, true);
    const below = computeShowcaseIdentityTileWidth(480, false);
    expect(beside).toBe(140);
    expect(below).toBe(120);
    expect(beside).toBeGreaterThan(below);
  });

  test('grows on wide desktop up to the identity max', () => {
    expect(computeShowcaseIdentityTileWidth(1100, true)).toBe(200);
  });

  test('stays compact on narrow widths even if rune column is reserved', () => {
    // 400px with rune reserve → ~100px tiles, still under the wide desktop max.
    expect(computeShowcaseIdentityTileWidth(400, true)).toBe(100);
  });
});
