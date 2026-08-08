import { describe, expect, test } from 'bun:test';
import { isCatalogGridLoading } from '@/lib/catalog-loading';

describe('isCatalogGridLoading', () => {
  test('returns true while search is pending', () => {
    expect(
      isCatalogGridLoading({
        isSearching: true,
        searchPending: true,
        isLoading: false,
        isFetching: false,
        searchItemsLength: 0,
        browseLoading: false,
      })
    ).toBe(true);
  });

  test('returns true while browse catalog is loading', () => {
    expect(
      isCatalogGridLoading({
        isSearching: false,
        searchPending: false,
        isLoading: false,
        isFetching: false,
        searchItemsLength: 0,
        browseLoading: true,
      })
    ).toBe(true);
  });

  test('returns false when search results are already visible', () => {
    expect(
      isCatalogGridLoading({
        isSearching: true,
        searchPending: false,
        isLoading: false,
        isFetching: true,
        searchItemsLength: 12,
        browseLoading: false,
      })
    ).toBe(false);
  });
});
