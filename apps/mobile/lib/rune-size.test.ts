import { describe, expect, test } from 'bun:test';
import { runeSizeForShortSide } from '@/lib/rune-size';

describe('runeSizeForShortSide', () => {
  test('uses lg on very small phones and xl otherwise', () => {
    expect(runeSizeForShortSide(320)).toBe('lg');
    expect(runeSizeForShortSide(359)).toBe('lg');
    expect(runeSizeForShortSide(360)).toBe('xl');
    expect(runeSizeForShortSide(390)).toBe('xl');
  });
});
