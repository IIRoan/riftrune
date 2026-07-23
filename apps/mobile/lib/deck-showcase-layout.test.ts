import { describe, expect, test } from 'bun:test';
import { computeShowcaseIdentityTileWidth } from '@/lib/deck-showcase-layout';

describe('computeShowcaseIdentityTileWidth', () => {
  test('uses full width when runes stack below', () => {
    // Phone-width showcase: legend + champion share the row, no rune column.
    expect(computeShowcaseIdentityTileWidth(360, false)).toBe(174);
  });

  test('reserves rune column when runes sit beside', () => {
    // Mid width where the beside path is not yet at the identity max.
    const beside = computeShowcaseIdentityTileWidth(480, true);
    const below = computeShowcaseIdentityTileWidth(480, false);
    expect(beside).toBe(140);
    expect(below).toBe(200);
    expect(beside).toBeLessThan(below);
  });

  test('grows on wide desktop up to the identity max', () => {
    expect(computeShowcaseIdentityTileWidth(1100, true)).toBe(200);
  });
});
