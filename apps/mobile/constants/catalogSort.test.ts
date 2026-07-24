import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_CATALOG_SORT,
  normalizeCatalogSort,
  sortOptionKey,
} from '@/constants/catalogSort';

describe('normalizeCatalogSort', () => {
  test('keeps supported sorts', () => {
    expect(normalizeCatalogSort({ sortBy: 'price', dir: 'desc' })).toEqual({
      sortBy: 'price',
      dir: 'desc',
    });
  });

  test('maps unsupported releaseDate sorts to default', () => {
    expect(normalizeCatalogSort({ sortBy: 'releaseDate', dir: 'desc' })).toEqual(
      DEFAULT_CATALOG_SORT
    );
    expect(normalizeCatalogSort({ sortBy: 'releaseDate', dir: 'asc' })).toEqual(
      DEFAULT_CATALOG_SORT
    );
  });

  test('sortOptionKey is stable for default', () => {
    expect(sortOptionKey(DEFAULT_CATALOG_SORT)).toBe('name:asc');
  });
});
