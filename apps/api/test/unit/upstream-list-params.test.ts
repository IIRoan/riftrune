import { describe, expect, test } from 'bun:test';
import type { CardsListQuery } from '@riftbound/contracts';
import {
  buildUpstreamListParams,
  resolveUpstreamReconcileMode,
  upstreamCheckKey,
} from '../../src/lib/upstream-list-params.js';

const baseQuery: CardsListQuery = {
  page: 1,
  limit: 40,
  sortBy: 'name',
  dir: 'asc',
};

describe('buildUpstreamListParams', () => {
  test('maps super to upstream supertypes', () => {
    expect(
      buildUpstreamListParams({
        ...baseQuery,
        types: 'Unit',
        super: 'Champion',
      })
    ).toEqual({
      page: 1,
      limit: 40,
      sortBy: 'name',
      dir: 'asc',
      types: 'Unit',
      supertypes: 'Champion',
    });
  });

  test('includes text search and battlefield filters', () => {
    expect(
      buildUpstreamListParams({
        ...baseQuery,
        q: 'flame',
        types: 'Battlefield',
      })
    ).toMatchObject({
      q: 'flame',
      types: 'Battlefield',
    });
  });
});

describe('upstreamCheckKey', () => {
  test('differentiates catalog filters', () => {
    const battlefield = upstreamCheckKey({ ...baseQuery, types: 'Battlefield' });
    const champion = upstreamCheckKey({
      ...baseQuery,
      types: 'Unit',
      super: 'Champion',
    });
    expect(battlefield).not.toBe(champion);
  });
});

describe('resolveUpstreamReconcileMode', () => {
  test('syncs when filtered browse returns no local rows', () => {
    expect(
      resolveUpstreamReconcileMode(
        { ...baseQuery, types: 'Battlefield' },
        { items: [], total: 0 },
        false
      )
    ).toBe('sync');
  });

  test('syncs paginated empty page', () => {
    expect(
      resolveUpstreamReconcileMode(
        { ...baseQuery, page: 2, types: 'Battlefield' },
        { items: [], total: 40 },
        false
      )
    ).toBe('sync');
  });

  test('background for search hits that already exist locally', () => {
    expect(
      resolveUpstreamReconcileMode(
        { ...baseQuery, q: 'vi' },
        { items: [{ id: '1' }], total: 10 },
        false
      )
    ).toBe('background');
  });

  test('skips when upstream was already checked for this query', () => {
    expect(
      resolveUpstreamReconcileMode(
        { ...baseQuery, types: 'Battlefield' },
        { items: [], total: 0 },
        true
      )
    ).toBe('skip');
  });
});
