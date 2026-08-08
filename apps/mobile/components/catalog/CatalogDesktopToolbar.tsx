import { View } from 'react-native';
import { CatalogActionBar } from '@/components/catalog/CatalogActionBar';
import { CatalogActiveFilterChips } from '@/components/catalog/FilterSheet';
import { FilterClearButton, FilterPopoverBar } from '@/components/filters/FilterPrimitives';
import type { CatalogCollectionFilter, CatalogFilters } from '@/constants/catalogFilters';
import { DEFAULT_CATALOG_FILTERS } from '@/constants/catalogFilters';
import type { CatalogSort } from '@/constants/catalogSort';
import {
  CATALOG_TOOLBAR_DESKTOP_DIVIDER_CLASS,
  CATALOG_TOOLBAR_DESKTOP_PRIMARY_ROW_CLASS,
  CATALOG_TOOLBAR_DESKTOP_SHELL_CLASS,
} from '@/constants/catalogToolbar';
import {
  useCatalogDesktopFilterPopoverState,
  useCatalogDesktopFilterSegments,
} from '@/hooks/useCatalogDesktopFilterSegments';

interface CatalogDesktopToolbarProps {
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
  filterActive: boolean;
  activeSort: CatalogSort;
  onSortPress: () => void;
  collection: CatalogCollectionFilter;
  onCollectionChange: (collection: CatalogCollectionFilter) => void;
  simpleAdd: boolean;
  onSimpleAddChange: (simpleAdd: boolean) => void;
}

/**
 * Desktop catalog chrome — filter controls with active chips beneath them,
 * plus collection/sort actions on the right.
 */
export function CatalogDesktopToolbar({
  filters,
  onFiltersChange,
  filterActive,
  activeSort,
  onSortPress,
  collection,
  onCollectionChange,
  simpleAdd,
  onSimpleAddChange,
}: CatalogDesktopToolbarProps) {
  const [openSegment, setOpenSegment] = useCatalogDesktopFilterPopoverState();
  const segments = useCatalogDesktopFilterSegments(filters, onFiltersChange);

  return (
    <View className={CATALOG_TOOLBAR_DESKTOP_SHELL_CLASS}>
      <View className={CATALOG_TOOLBAR_DESKTOP_PRIMARY_ROW_CLASS}>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-1">
            <FilterPopoverBar
              portalName="catalog-filter-bar"
              openId={openSegment}
              onOpenIdChange={setOpenSegment}
              segments={segments}
              embedded
            />
            {filterActive ? (
              <FilterClearButton
                embedded
                onPress={() =>
                  onFiltersChange({ ...DEFAULT_CATALOG_FILTERS, simpleAdd: filters.simpleAdd })
                }
              />
            ) : null}
          </View>

          {filterActive ? (
            <CatalogActiveFilterChips
              layout="inline"
              filters={filters}
              onFiltersChange={onFiltersChange}
            />
          ) : null}
        </View>

        <View className={CATALOG_TOOLBAR_DESKTOP_DIVIDER_CLASS} />

        <CatalogActionBar
          inline
          activeSort={activeSort}
          onSortPress={onSortPress}
          filters={filters}
          onFilterPress={() => undefined}
          collection={collection}
          onCollectionChange={onCollectionChange}
          simpleAdd={simpleAdd}
          onSimpleAddChange={onSimpleAddChange}
          showFilterTrigger={false}
        />
      </View>
    </View>
  );
}
