import { View } from 'react-native';
import { CatalogCollectionPillNav } from '@/components/catalog/CatalogCollectionPillNav';
import { CatalogFilterTrigger } from '@/components/catalog/FilterSheet';
import { SortTrigger } from '@/components/catalog/SortSheet';
import { ViewToggle } from '@/components/catalog/ViewToggle';
import { Text } from '@/components/ui/text';
import type { CatalogCollectionFilter, CatalogFilters } from '@/constants/catalogFilters';
import type { CatalogSort } from '@/constants/catalogSort';
import {
  CATALOG_TOOLBAR_MOBILE_ROW_CLASS,
  CATALOG_TOOLBAR_MOBILE_SLOT_CLASS,
} from '@/constants/catalogToolbar';
import { useMobileLayout, useShowCatalogTitle } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';

interface CatalogActionBarProps {
  view: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
  activeSort: CatalogSort;
  onSortPress: () => void;
  filters: CatalogFilters;
  onFilterPress: () => void;
  collection: CatalogCollectionFilter;
  onCollectionChange: (collection: CatalogCollectionFilter) => void;
  showFilterTrigger?: boolean;
  className?: string;
}

/** Catalog toolbar: optional title + collection/view/sort/filter controls. */
export function CatalogActionBar({
  view,
  onViewChange,
  activeSort,
  onSortPress,
  filters,
  onFilterPress,
  collection,
  onCollectionChange,
  showFilterTrigger = true,
  className,
}: CatalogActionBarProps) {
  const isMobile = useMobileLayout();
  const showTitle = useShowCatalogTitle();

  const collectionSwitch = (
    <CatalogCollectionPillNav value={collection} onChange={onCollectionChange} />
  );

  const outerClass = showTitle
    ? isMobile
      ? 'gap-2'
      : 'mb-1 flex-row items-center justify-between'
    : 'w-full flex-row items-center';

  const controlsClass = isMobile
    ? CATALOG_TOOLBAR_MOBILE_ROW_CLASS
    : showTitle
      ? 'shrink-0 flex-row items-center gap-2'
      : 'w-full flex-row items-center justify-between';

  return (
    <View className={cn(outerClass, className)}>
      {showTitle ? (
        <Text
          className={cn(
            'font-semibold tracking-tight text-foreground',
            isMobile ? 'text-lg' : 'text-xl'
          )}
        >
          Riftbound catalog
        </Text>
      ) : null}
      <View className={controlsClass}>
        {isMobile ? (
          <>
            <View className="shrink-0">{collectionSwitch}</View>
            <ViewToggle view={view} onViewChange={onViewChange} mobile />
            <View className={CATALOG_TOOLBAR_MOBILE_SLOT_CLASS}>
              <SortTrigger activeSort={activeSort} onPress={onSortPress} compact mobile />
            </View>
            {showFilterTrigger ? (
              <View className={CATALOG_TOOLBAR_MOBILE_SLOT_CLASS}>
                <CatalogFilterTrigger
                  filters={filters}
                  onPress={onFilterPress}
                  compact
                  mobile
                />
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View className="flex-row items-center gap-2">
              {collectionSwitch}
              <ViewToggle view={view} onViewChange={onViewChange} />
            </View>
            <View className="flex-row items-center gap-2">
              <SortTrigger activeSort={activeSort} onPress={onSortPress} />
              {showFilterTrigger ? (
                <CatalogFilterTrigger filters={filters} onPress={onFilterPress} />
              ) : null}
            </View>
          </>
        )}
      </View>
    </View>
  );
}
