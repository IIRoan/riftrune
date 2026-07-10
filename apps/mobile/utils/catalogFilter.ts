/** @deprecated Import from `@/constants/catalogFilters` instead. */
export {
  DEFAULT_CATALOG_FILTERS,
  matchesCatalogFilters as matchesCatalogFilter,
  type CatalogFilters,
} from '@/constants/catalogFilters';

/** @deprecated Use `DEFAULT_CATALOG_FILTERS` instead. */
export const ALL_CARDS_FILTER = 'All cards';

/** @deprecated Filter groups are loaded from `/api/v1/filters`. */
export const FILTER_GROUPS = [] as const;
