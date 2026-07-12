import { useState } from 'react';
import { View } from 'react-native';
import { DeckBrowseFilterSegmentPanel } from '@/components/deck/DeckBrowseFilterPanels';
import { FilterClearButton, FilterPopoverSection } from '@/components/filters/FilterPrimitives';
import {
  DEFAULT_DECK_BROWSE_FILTERS,
  deckBrowseFiltersActive,
  type DeckBrowseFilters,
} from '@/constants/deckBrowse';
import {
  DECK_BROWSE_FILTER_SEGMENTS,
  deckBrowseFilterSegmentActive,
  type DeckBrowseFilterSegment,
} from '@/lib/deck-browse';

interface DeckBrowseDesktopFilterBarProps {
  filters: DeckBrowseFilters;
  onFiltersChange: (filters: DeckBrowseFilters) => void;
}

export function DeckBrowseDesktopFilterBar({
  filters,
  onFiltersChange,
}: DeckBrowseDesktopFilterBarProps) {
  const [openSegment, setOpenSegment] = useState<DeckBrowseFilterSegment | null>(null);

  const handleOpenChange = (segment: DeckBrowseFilterSegment, open: boolean) => {
    setOpenSegment(open ? segment : null);
  };

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      {DECK_BROWSE_FILTER_SEGMENTS.map((segment) => (
        <FilterPopoverSection
          key={segment.id}
          label={segment.label}
          hasValue={deckBrowseFilterSegmentActive(segment.id, filters)}
          open={openSegment === segment.id}
          onOpenChange={(open) => handleOpenChange(segment.id, open)}
          portalName={`deck-browse-filter-${segment.id}`}
          contentClassName={segment.id === 'legends' ? 'w-[300px]' : undefined}
          maxHeight={segment.id === 'legends' ? 360 : 280}
        >
          <DeckBrowseFilterSegmentPanel
            segment={segment.id}
            filters={filters}
            onFiltersChange={onFiltersChange}
            enabled={openSegment === segment.id}
            compact
          />
        </FilterPopoverSection>
      ))}

      {deckBrowseFiltersActive(filters) ? (
        <FilterClearButton onPress={() => onFiltersChange(DEFAULT_DECK_BROWSE_FILTERS)} />
      ) : null}
    </View>
  );
}
