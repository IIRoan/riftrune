import { describe, expect, mock, test } from 'bun:test';

// Pure helper under test lives beside filter fetching; stub side-effect imports.
mock.module('@/lib/prefetchFilterIcons', () => ({
  prefetchFilterIcons: () => undefined,
}));

mock.module('@/src/api/client', () => ({
  api: {
    getFilters: async () => ({ data: {}, meta: { variantCount: 0 } }),
  },
}));

const { filtersQueryUiState } = await import('@/hooks/useFiltersData');

describe('filtersQueryUiState', () => {
  test('shows loading only on the initial pending fetch', () => {
    expect(
      filtersQueryUiState({
        data: undefined,
        isPending: true,
        isError: false,
      })
    ).toEqual({ isLoading: true, isError: false });
  });

  test('does not show loading during background refetch when cached data exists', () => {
    expect(
      filtersQueryUiState({
        data: { sets: [] },
        isPending: false,
        isError: false,
      })
    ).toEqual({ isLoading: false, isError: false });
  });

  test('does not treat isFetching-style background refresh as initial load', () => {
    // TanStack Query v5: a refetch with cached data has isPending=false.
    expect(
      filtersQueryUiState({
        data: { sets: [] },
        isPending: false,
        isError: false,
      }).isLoading
    ).toBe(false);
  });

  test('shows error when the first fetch fails without cached data', () => {
    expect(
      filtersQueryUiState({
        data: undefined,
        isPending: false,
        isError: true,
      })
    ).toEqual({ isLoading: false, isError: true });
  });

  test('keeps showing cached filters after a background refetch error', () => {
    expect(
      filtersQueryUiState({
        data: { sets: [{ code: 'OGN' }] },
        isPending: false,
        isError: true,
      })
    ).toEqual({ isLoading: false, isError: false });
  });
});
