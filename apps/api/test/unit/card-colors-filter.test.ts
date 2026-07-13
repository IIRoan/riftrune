import { describe, expect, test } from 'bun:test';
import { buildCardColorsContainsAllCondition } from '../../src/lib/card-colors-filter.js';

describe('buildCardColorsContainsAllCondition', () => {
  test('returns undefined for empty color list', () => {
    expect(buildCardColorsContainsAllCondition([])).toBeUndefined();
  });

  test('returns SQL for required colors', () => {
    expect(buildCardColorsContainsAllCondition(['Body'])).toBeDefined();
    expect(buildCardColorsContainsAllCondition(['Body', 'Calm'])).toBeDefined();
  });
});
