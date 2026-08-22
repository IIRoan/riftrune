export type CatalogGridLoadingInput = {
  isSearching: boolean;
  searchPending: boolean;
  isLoading: boolean;
  isFetching: boolean;
  searchItemsLength: number;
  browseLoading: boolean;
};

/** True while the catalog grid is showing its loading skeleton. */
export function isCatalogGridLoading({
  isSearching,
  searchPending,
  isLoading,
  isFetching,
  searchItemsLength,
  browseLoading,
}: CatalogGridLoadingInput): boolean {
  if (isSearching) {
    return searchPending || isLoading || (isFetching && searchItemsLength === 0);
  }
  return browseLoading;
}

export type CatalogDisplayItemsInput<T> = {
  hasSearchInput: boolean;
  searchItems: T[];
  browseItems: T[];
  searchPending: boolean;
  isLoading: boolean;
  isFetching: boolean;
  /** Unfiltered search hit count — empty means the query has no page yet. */
  searchItemsLength: number;
};

/**
 * Prefer search hits once available for the settled query.
 * While the draft is still debouncing or the first page is in flight, return
 * an empty list so the UI can show a skeleton instead of flashing the previous
 * term's hits (or browsing tiles mid-search).
 */
export function resolveCatalogDisplayItems<T>({
  hasSearchInput,
  searchItems,
  browseItems,
  searchPending,
  isLoading,
  isFetching,
  searchItemsLength,
}: CatalogDisplayItemsInput<T>): T[] {
  if (!hasSearchInput) return browseItems;
  if (searchPending) return [];
  const waitingForFirstPage =
    searchItemsLength === 0 && (isLoading || isFetching);
  if (waitingForFirstPage) return [];
  return searchItems;
}
