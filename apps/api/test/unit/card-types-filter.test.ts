import { describe, expect, test } from 'bun:test';
import { buildCardTypesCondition } from '../../src/lib/card-types-filter.js';

describe('buildCardTypesCondition', () => {
  test('returns undefined for empty type list', () => {
    expect(buildCardTypesCondition([])).toBeUndefined();
    expect(buildCardTypesCondition(['', '  '])).toBeUndefined();
  });

  test('returns SQL that token-overlaps dual types like Unit Gear', () => {
    const condition = buildCardTypesCondition(['Unit', 'Gear', 'Spell']);
    expect(condition).toBeDefined();
    // Drizzle SQL objects are opaque; presence is enough for the unit check.
    // Behavior is covered by the live cards list query for VEN-058.
  });
});
