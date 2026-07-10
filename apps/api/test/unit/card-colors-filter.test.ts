import { describe, expect, test } from 'bun:test';
import {
  buildCardColorsContainsAllCondition,
  buildCardColorsSubsetCondition,
} from '../../src/lib/card-colors-filter.js';

describe('buildCardColorsSubsetCondition', () => {
  test('returns undefined for empty color list', () => {
    expect(buildCardColorsSubsetCondition([])).toBeUndefined();
    expect(buildCardColorsSubsetCondition(['', '  '])).toBeUndefined();
  });

  test('returns SQL for allowed colors', () => {
    const condition = buildCardColorsSubsetCondition(['Body', 'Order']);
    expect(condition).toBeDefined();
  });
});

describe('buildCardColorsContainsAllCondition', () => {
  test('returns undefined for empty color list', () => {
    expect(buildCardColorsContainsAllCondition([])).toBeUndefined();
  });

  test('returns SQL for required colors', () => {
    expect(buildCardColorsContainsAllCondition(['Body'])).toBeDefined();
    expect(buildCardColorsContainsAllCondition(['Body', 'Calm'])).toBeDefined();
  });
});
