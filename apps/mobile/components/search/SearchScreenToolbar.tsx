import { View } from 'react-native';
import { CatalogActionBar } from '@/components/catalog/CatalogActionBar';
import { CatalogDesktopFilterBar } from '@/components/catalog/CatalogDesktopFilterBar';
import { CatalogActiveFilterChips } from '@/components/catalog/FilterSheet';
import { SearchBar } from '@/components/search/SearchBar';
import type { CatalogSort } from '@/constants/catalogSort';
import type { CatalogFilters } from '@/constants/catalogFilters';

interface SearchScreenToolbarProps {
  pageMaxWidth?: number;
  query: string;
  onQueryChange: (text: string) => void;
  onClearSearch: () => void;
  searchLoading: boolean;
  onSubmitSearch: () => void;
  isMobile: boolean;
  filterActive: boolean;
  catalogFilters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  catalogSort: CatalogSort;
  onSortPress: () => void;
  onFilterPress: () => void;
}

export function SearchScreenToolbar({
  pageMaxWidth,
  query,
  onQueryChange,
  onClearSearch,
  searchLoading,
  onSubmitSearch,
  isMobile,
  filterActive,
  catalogFilters,
  onFiltersChange,
  view,
  onViewChange,
  catalogSort,
  onSortPress,
  onFilterPress,
}: SearchScreenToolbarProps) {
  return (
    <View className="w-full gap-1.5 pb-2 pt-2" style={{ maxWidth: pageMaxWidth }}>
      <SearchBar
        value={query}
        onChangeText={onQueryChange}
        onClear={onClearSearch}
        isLoading={searchLoading}
        placeholder="Search cards, artists, tags, or set numbers"
        onSubmitEditing={onSubmitSearch}
      />

      {isMobile && filterActive ? (
        <CatalogActiveFilterChips filters={catalogFilters} onFiltersChange={onFiltersChange} />
      ) : null}

      {!isMobile ? (
        <CatalogDesktopFilterBar filters={catalogFilters} onFiltersChange={onFiltersChange} />
      ) : null}

      {!isMobile && filterActive ? (
        <CatalogActiveFilterChips filters={catalogFilters} onFiltersChange={onFiltersChange} />
      ) : null}

      <CatalogActionBar
        view={view}
        onViewChange={onViewChange}
        activeSort={catalogSort}
        onSortPress={onSortPress}
        filters={catalogFilters}
        onFilterPress={onFilterPress}
        collection={catalogFilters.collection}
        onCollectionChange={(collection) =>
          onFiltersChange({ ...catalogFilters, collection })
        }
        simpleAdd={catalogFilters.simpleAdd}
        onSimpleAddChange={(simpleAdd) =>
          onFiltersChange({ ...catalogFilters, simpleAdd })
        }
        showFilterTrigger={isMobile}
      />
    </View>
  );
}
