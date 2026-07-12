import { useState } from 'react';
import { View } from 'react-native';
import { CatalogFilterSegmentPanel } from '@/components/catalog/CatalogFilterPanels';
import {
  FilterClearButton,
  FilterCollectionSegment,
  FilterPopoverSection,
} from '@/components/filters/FilterPrimitives';
import {
  CATALOG_FILTER_SEGMENTS,
  catalogFilterSegmentActive,
  catalogFiltersActive,
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilterSegment,
  type CatalogFilters,
} from '@/constants/catalogFilters';

interface CatalogDesktopFilterBarProps {
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
}

export function CatalogDesktopFilterBar({
  filters,
  onFiltersChange,
}: CatalogDesktopFilterBarProps) {
  const [openSegment, setOpenSegment] = useState<CatalogFilterSegment | null>(null);

  const handleOpenChange = (segment: CatalogFilterSegment, open: boolean) => {
    setOpenSegment(open ? segment : null);
  };

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <FilterCollectionSegment
        value={filters.collection}
        onChange={(collection) => onFiltersChange({ ...filters, collection })}
      />

      <View className="h-6 w-px bg-border" accessibilityElementsHidden />

      {CATALOG_FILTER_SEGMENTS.filter((segment) => segment.id !== 'collection').map(
        (segment) => (
          <FilterPopoverSection
            key={segment.id}
            label={segment.label}
            hasValue={catalogFilterSegmentActive(segment.id, filters)}
            open={openSegment === segment.id}
            onOpenChange={(open) => handleOpenChange(segment.id, open)}
            portalName={`catalog-filter-${segment.id}`}
            contentClassName={segment.id === 'stats' ? 'w-[320px]' : undefined}
            maxHeight={segment.id === 'stats' ? 400 : 320}
          >
            <CatalogFilterSegmentPanel
              segment={segment.id}
              filters={filters}
              onFiltersChange={onFiltersChange}
              compact
            />
          </FilterPopoverSection>
        )
      )}

      {catalogFiltersActive(filters) ? (
        <FilterClearButton onPress={() => onFiltersChange(DEFAULT_CATALOG_FILTERS)} />
      ) : null}
    </View>
  );
}
