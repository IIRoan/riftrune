import { describe, expect, test } from 'bun:test';
import { filtersQueryUiState } from '@/hooks/useFiltersData';

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
