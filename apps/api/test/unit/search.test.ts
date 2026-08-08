import { describe, expect, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import {
  buildCardSearchCondition,
  buildSearchRelevanceOrder,
  escapeRegexLiteral,
  tokenizeSearchQuery,
  wholeWordPattern,
} from '../../src/lib/search.js';

const dialect = new PgDialect();

function compile(fragment: Parameters<PgDialect['sqlToQuery']>[0]) {
  return dialect.sqlToQuery(fragment);
}

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

  test('matches names regardless of spaces in the query', () => {
    const spaced = compile(buildCardSearchCondition('soul spinner')!);
    const compact = compile(buildCardSearchCondition('soulspinner')!);

    for (const compiled of [spaced, compact]) {
      expect(compiled.sql.toLowerCase()).toContain('replace(lower(');
      expect(compiled.params).toContain('%soulspinner%');
    }
  });

  test('keeps per-token matching alongside the squashed name clause', () => {
    const compiled = compile(buildCardSearchCondition('soul spinner')!);
    expect(compiled.params).toContain('%soul%');
    expect(compiled.params).toContain('%spinner%');
  });

  test('searches variant labels and uses whole-word rules matching', () => {
    const compiled = compile(buildCardSearchCondition('signed')!);
    expect(compiled.sql.toLowerCase()).toContain('variant_label');
    expect(compiled.sql).toContain('~*');
    expect(compiled.params).toContain('%signed%');
    expect(compiled.params).toContain(wholeWordPattern('signed'));
  });
});

describe('wholeWordPattern', () => {
  test('escapes regex metacharacters in the token', () => {
    expect(escapeRegexLiteral('a+b')).toBe('a\\+b');
    expect(wholeWordPattern('signed')).toBe('(^|[^[:alnum:]_])signed([^[:alnum:]_]|$)');
  });
});

describe('buildSearchRelevanceOrder', () => {
  test('returns a SQL ordering fragment', () => {
    expect(buildSearchRelevanceOrder('vi')).toBeDefined();
  });

  test('ranks space-insensitive name matches', () => {
    const compiled = compile(buildSearchRelevanceOrder('soul spinner'));
    expect(compiled.sql.toLowerCase()).toContain('replace(lower(');
    expect(compiled.params).toContain('soulspinner%');
    expect(compiled.params).toContain('%soulspinner%');
  });
});
