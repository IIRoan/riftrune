import { View } from 'react-native';
import { CatalogFilterTrigger } from '@/components/catalog/FilterSheet';
import { SortTrigger } from '@/components/catalog/SortSheet';
import { ViewToggle } from '@/components/catalog/ViewToggle';
import { Text } from '@/components/ui/text';
import type { CatalogFilters } from '@/constants/catalogFilters';
import {
  CATALOG_TOOLBAR_MOBILE_ROW_CLASS,
  CATALOG_TOOLBAR_MOBILE_SLOT_CLASS,
} from '@/constants/catalogToolbar';
import { useMobileLayout, useShowCatalogTitle } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';

interface CatalogActionBarProps {
  view: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
  onSortPress: () => void;
  filters: CatalogFilters;
  onFilterPress: () => void;
  className?: string;
}

/** Catalog toolbar: optional title + view/sort/filter controls. */
export function CatalogActionBar({
  view,
  onViewChange,
  onSortPress,
  filters,
  onFilterPress,
  className,
}: CatalogActionBarProps) {
  const isMobile = useMobileLayout();
  const showTitle = useShowCatalogTitle();

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
            <ViewToggle view={view} onViewChange={onViewChange} mobile />
            <View className={CATALOG_TOOLBAR_MOBILE_SLOT_CLASS}>
              <SortTrigger onPress={onSortPress} compact mobile />
            </View>
            <View className={CATALOG_TOOLBAR_MOBILE_SLOT_CLASS}>
              <CatalogFilterTrigger
                filters={filters}
                onPress={onFilterPress}
                compact
                mobile
              />
            </View>
          </>
        ) : (
          <>
            <ViewToggle view={view} onViewChange={onViewChange} />
            <View className="flex-row items-center gap-2">
              <SortTrigger label="Sort" onPress={onSortPress} />
              <CatalogFilterTrigger filters={filters} onPress={onFilterPress} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}
