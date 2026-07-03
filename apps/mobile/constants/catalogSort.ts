import type { CardsListQuery } from '@riftbound/contracts';

export type CatalogSortField = CardsListQuery['sortBy'];
export type CatalogSortDir = CardsListQuery['dir'];

export type CatalogSort = {
  sortBy: CatalogSortField;
  dir: CatalogSortDir;
};

export const DEFAULT_CATALOG_SORT: CatalogSort = {
  sortBy: 'name',
  dir: 'asc',
};

export const CATALOG_SORT_OPTIONS: {
  sortBy: CatalogSortField;
  dir: CatalogSortDir;
  label: string;
}[] = [
  { sortBy: 'name', dir: 'asc', label: 'Name (A–Z)' },
  { sortBy: 'name', dir: 'desc', label: 'Name (Z–A)' },
  { sortBy: 'variantNumber', dir: 'asc', label: 'Card number (A–Z)' },
  { sortBy: 'variantNumber', dir: 'desc', label: 'Card number (Z–A)' },
  { sortBy: 'energy', dir: 'asc', label: 'Cost (low to high)' },
  { sortBy: 'energy', dir: 'desc', label: 'Cost (high to low)' },
  { sortBy: 'releaseDate', dir: 'desc', label: 'Newest first' },
  { sortBy: 'releaseDate', dir: 'asc', label: 'Oldest first' },
];

export function sortOptionKey(sort: CatalogSort): string {
  return `${sort.sortBy}:${sort.dir}`;
}

export function findSortOption(sort: CatalogSort) {
  return (
    CATALOG_SORT_OPTIONS.find(
      (o) => o.sortBy === sort.sortBy && o.dir === sort.dir
    ) ?? CATALOG_SORT_OPTIONS[0]
  );
}
