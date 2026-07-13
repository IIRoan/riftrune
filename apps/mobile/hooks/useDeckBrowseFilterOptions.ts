import { useMemo } from 'react';
import {
  deckBrowseSetNameLookup,
  deckBrowseSetOptionsFromFilters,
  type DeckBrowseSetOption,
} from '@/constants/deckBrowse';
import { useFiltersData } from '@/hooks/useFiltersData';

export function useDeckBrowseFilterOptions(): {
  isLoading: boolean;
  setOptions: DeckBrowseSetOption[];
  setNameByCode: Map<string, string>;
} {
  const filtersQuery = useFiltersData();

  const setOptions = useMemo(
    () => deckBrowseSetOptionsFromFilters(filtersQuery.data?.sets),
    [filtersQuery.data?.sets]
  );

  const setNameByCode = useMemo(() => deckBrowseSetNameLookup(setOptions), [setOptions]);

  return {
    isLoading: !filtersQuery.data && (filtersQuery.isLoading || filtersQuery.isFetching),
    setOptions,
    setNameByCode,
  };
}
