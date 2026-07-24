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
  /** Compact toolbar label for narrow slots. */
  shortLabel: string;
}[] = [
  { sortBy: 'name', dir: 'asc', label: 'Name (A–Z)', shortLabel: 'A–Z' },
  { sortBy: 'name', dir: 'desc', label: 'Name (Z–A)', shortLabel: 'Z–A' },
  {
    sortBy: 'variantNumber',
    dir: 'asc',
    label: 'Card number (A–Z)',
    shortLabel: '# A–Z',
  },
  {
    sortBy: 'variantNumber',
    dir: 'desc',
    label: 'Card number (Z–A)',
    shortLabel: '# Z–A',
  },
  { sortBy: 'energy', dir: 'asc', label: 'Cost (low to high)', shortLabel: 'Cost ↑' },
  { sortBy: 'energy', dir: 'desc', label: 'Cost (high to low)', shortLabel: 'Cost ↓' },
  { sortBy: 'price', dir: 'desc', label: 'Price (high to low)', shortLabel: 'Price ↓' },
  { sortBy: 'price', dir: 'asc', label: 'Price (low to high)', shortLabel: 'Price ↑' },
];

export function sortOptionKey(sort: CatalogSort): string {
  return `${sort.sortBy}:${sort.dir}`;
}

/** Drop unsupported sorts (e.g. releaseDate) onto the default. */
export function normalizeCatalogSort(sort: CatalogSort): CatalogSort {
  const supported = CATALOG_SORT_OPTIONS.some(
    (option) => option.sortBy === sort.sortBy && option.dir === sort.dir
  );
  return supported ? sort : DEFAULT_CATALOG_SORT;
}

export function findSortOption(sort: CatalogSort) {
  const normalized = normalizeCatalogSort(sort);
  return (
    CATALOG_SORT_OPTIONS.find(
      (o) => o.sortBy === normalized.sortBy && o.dir === normalized.dir
    ) ?? CATALOG_SORT_OPTIONS[0]!
  );
}

export function isDefaultCatalogSort(sort: CatalogSort): boolean {
  return (
    sort.sortBy === DEFAULT_CATALOG_SORT.sortBy && sort.dir === DEFAULT_CATALOG_SORT.dir
  );
}
