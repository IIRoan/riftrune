import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_DECK_BROWSE_FILTERS,
  sanitizeDeckBrowseFilters,
  type DeckBrowseFilters,
} from '@/constants/deckBrowse';
import { useDeckBrowseFilterOptions } from '@/hooks/useDeckBrowseFilterOptions';

export function useDeckBrowseFilters(): [
  DeckBrowseFilters,
  (filters: DeckBrowseFilters) => void,
] {
  const [filters, setFilters] = useState<DeckBrowseFilters>(DEFAULT_DECK_BROWSE_FILTERS);
  const { setOptions } = useDeckBrowseFilterOptions();
  const availableSetCodes = useMemo(
    () => setOptions.map((option) => option.code),
    [setOptions]
  );

  useEffect(() => {
    if (availableSetCodes.length === 0) return;
    setFilters((current) => sanitizeDeckBrowseFilters(current, availableSetCodes));
  }, [availableSetCodes]);

  const setFiltersSafe = useCallback(
    (next: DeckBrowseFilters) => {
      setFilters(
        availableSetCodes.length > 0
          ? sanitizeDeckBrowseFilters(next, availableSetCodes)
          : next
      );
    },
    [availableSetCodes]
  );

  return [filters, setFiltersSafe];
}
