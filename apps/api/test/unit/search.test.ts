import { describe, expect, test } from 'bun:test';
import {
  buildCardSearchCondition,
  buildSearchRelevanceOrder,
  tokenizeSearchQuery,
} from '../../src/lib/search.js';

describe('tokenizeSearchQuery', () => {
  test('splits on whitespace and lowercases', () => {
    expect(tokenizeSearchQuery('  Vi   Destruct  ')).toEqual(['vi', 'destruct']);
  });

  test('returns empty array for blank input', () => {
    expect(tokenizeSearchQuery('   ')).toEqual([]);
  });

  test('preserves single-character tokens', () => {
    expect(tokenizeSearchQuery('a b')).toEqual(['a', 'b']);
  });
});

describe('buildCardSearchCondition', () => {
  test('returns undefined for blank queries', () => {
    expect(buildCardSearchCondition('   ')).toBeUndefined();
  });

  test('builds a SQL fragment for one or more tokens', () => {
    expect(buildCardSearchCondition('vi')).toBeDefined();
    expect(buildCardSearchCondition('vi destructive')).toBeDefined();
  });
});

describe('buildSearchRelevanceOrder', () => {
  test('returns a SQL ordering fragment', () => {
    expect(buildSearchRelevanceOrder('vi')).toBeDefined();
  });
});
