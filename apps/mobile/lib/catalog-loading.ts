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
