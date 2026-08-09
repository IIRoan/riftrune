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
 * Prefer search hits once available; while the first page is in flight, keep
 * browse tiles so the list does not collapse under a focused search field.
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
  const waitingForFirstPage =
    searchItems.length === 0 &&
    searchItemsLength === 0 &&
    (searchPending || isLoading || isFetching);
  if (waitingForFirstPage) return browseItems;
  return searchItems;
}
