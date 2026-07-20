import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { CatalogFilterSegmentPanel } from '@/components/catalog/CatalogFilterPanels';
import { FilterClearButton, FilterPopoverBar } from '@/components/filters/FilterPrimitives';
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

  const segments = useMemo(
    () =>
      CATALOG_FILTER_SEGMENTS.filter((segment) => segment.id !== 'collection').map(
        (segment) => ({
          id: segment.id,
          label: segment.label,
          hasValue: catalogFilterSegmentActive(segment.id, filters),
          contentClassName: segment.id === 'stats' ? 'w-[320px]' : undefined,
          maxHeight: segment.id === 'stats' ? 480 : 420,
          children: (
            <CatalogFilterSegmentPanel
              segment={segment.id}
              filters={filters}
              onFiltersChange={onFiltersChange}
              compact
            />
          ),
        })
      ),
    [filters, onFiltersChange]
  );

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <FilterPopoverBar
        portalName="catalog-filter-bar"
        openId={openSegment}
        onOpenIdChange={setOpenSegment}
        segments={segments}
      />

      {catalogFiltersActive(filters) ? (
        <FilterClearButton onPress={() => onFiltersChange(DEFAULT_CATALOG_FILTERS)} />
      ) : null}
    </View>
  );
}
