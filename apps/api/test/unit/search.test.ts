import { describe, expect, test } from 'bun:test';
import { tokenizeSearchQuery } from '../../src/lib/search.js';

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
