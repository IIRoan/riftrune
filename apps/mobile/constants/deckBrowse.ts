import type { DeckSortField } from '@riftbound/contracts';

export type DeckBrowseSort = {
  sort: DeckSortField;
  dir: 'asc' | 'desc';
};

export const DEFAULT_DECK_BROWSE_SORT: DeckBrowseSort = {
  sort: 'trending',
  dir: 'desc',
};

export const DECK_BROWSE_SORT_OPTIONS: {
  sort: DeckSortField;
  dir: 'asc' | 'desc';
  label: string;
}[] = [
  { sort: 'trending', dir: 'desc', label: 'Trending' },
  { sort: 'likes', dir: 'desc', label: 'Most liked' },
  { sort: 'views', dir: 'desc', label: 'Most viewed' },
  { sort: 'createdAt', dir: 'desc', label: 'Newest' },
  { sort: 'createdAt', dir: 'asc', label: 'Oldest' },
  { sort: 'editedAt', dir: 'desc', label: 'Recently edited' },
];

export function deckBrowseSortKey(sort: DeckBrowseSort): string {
  return `${sort.sort}:${sort.dir}`;
}

export function findDeckBrowseSortOption(sort: DeckBrowseSort) {
  return (
    DECK_BROWSE_SORT_OPTIONS.find(
      (option) => option.sort === sort.sort && option.dir === sort.dir
    ) ?? DECK_BROWSE_SORT_OPTIONS[0]
  );
}

export type DeckBrowseFilters = {
  legend?: string;
  sets: string[];
  isLegal?: boolean;
  hasGuide: boolean;
  hasVideo: boolean;
  hasMatchups: boolean;
};

export const DEFAULT_DECK_BROWSE_FILTERS: DeckBrowseFilters = {
  sets: [],
  hasGuide: false,
  hasVideo: false,
  hasMatchups: false,
};

export function deckBrowseFiltersActive(filters: DeckBrowseFilters): boolean {
  return Boolean(
    filters.legend ||
      filters.sets.length > 0 ||
      filters.isLegal !== undefined ||
      filters.hasGuide ||
      filters.hasVideo ||
      filters.hasMatchups
  );
}

export function countDeckBrowseFilters(filters: DeckBrowseFilters): number {
  let count = 0;
  if (filters.legend) count += 1;
  if (filters.sets.length > 0) count += 1;
  if (filters.isLegal !== undefined) count += 1;
  if (filters.hasGuide) count += 1;
  if (filters.hasVideo) count += 1;
  if (filters.hasMatchups) count += 1;
  return count;
}

/** Set prefixes shown in browse filters (matches Piltover Archive deck library). */
export const DECK_BROWSE_SET_OPTIONS = [
  { code: 'OGN', name: 'Origins' },
  { code: 'SFD', name: 'Spiritforged' },
  { code: 'UNL', name: 'Unleashed' },
  { code: 'OGS', name: 'Proving Grounds' },
] as const;

export function deckBrowseFiltersToQuery(
  filters: DeckBrowseFilters
): Pick<
  import('@riftbound/contracts').DecksListQuery,
  'legend' | 'sets' | 'isLegal' | 'hasGuide' | 'hasVideo' | 'hasMatchups'
> {
  return {
    ...(filters.legend ? { legend: filters.legend } : {}),
    ...(filters.sets.length > 0 ? { sets: filters.sets.join(',') } : {}),
    ...(filters.isLegal !== undefined ? { isLegal: filters.isLegal } : {}),
    ...(filters.hasGuide ? { hasGuide: true } : {}),
    ...(filters.hasVideo ? { hasVideo: true } : {}),
    ...(filters.hasMatchups ? { hasMatchups: true } : {}),
  };
}
