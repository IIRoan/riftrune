import { SlidersHorizontalIcon } from '@/components/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  CatalogToolbarBadgeDot,
  CatalogToolbarButton,
} from '@/components/catalog/CatalogToolbarButton';
import { CatalogFilterSegmentPanel, useCatalogFilterOptions } from '@/components/catalog/CatalogFilterPanels';
import {
  FilterAccordionGroup,
  FilterAccordionSection,
  MobileFilterSheet,
} from '@/components/filters/MobileFilterSheet';
import { FilterKeywordChip } from '@/components/riftbound/RiftboundBadges';
import { DomainIcon } from '@/components/riftbound/CardIcons';
import { Text } from '@/components/ui/text';
import { hapticPress } from '@/utils/haptics';
import {
  CATALOG_FILTER_SEGMENTS,
  catalogFilterChips,
  catalogFilterSegmentActive,
  catalogFilterSegmentSummary,
  catalogFiltersActive,
  countCatalogFilters,
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
} from '@/constants/catalogFilters';
import { prefetchCatalogFilters } from '@/hooks/useFiltersData';

interface CatalogFilterSheetProps {
  visible: boolean;
  filters: CatalogFilters;
  onClose: () => void;
  onFiltersChange: (filters: CatalogFilters) => void;
}

const MOBILE_FILTER_SEGMENTS = CATALOG_FILTER_SEGMENTS.filter(
  (segment) => segment.id !== 'collection'
);

function defaultOpenSegments(filters: CatalogFilters): string[] {
  const active = MOBILE_FILTER_SEGMENTS.filter((segment) =>
    catalogFilterSegmentActive(segment.id, filters)
  ).map((segment) => segment.id);

  if (active.length > 0) return active;
  return ['colors'];
}

export function CatalogFilterSheet({
  visible,
  filters,
  onClose,
  onFiltersChange,
}: CatalogFilterSheetProps) {
  const queryClient = useQueryClient();
  const activeCount = countCatalogFilters(filters);
  const accordionKey = visible ? 'open' : 'closed';
  const defaultOpen = useMemo(() => defaultOpenSegments(filters), [filters, accordionKey]);

  useEffect(() => {
    if (!visible) return;
    void prefetchCatalogFilters(queryClient);
  }, [visible, queryClient]);

  return (
    <MobileFilterSheet
      visible={visible}
      onClose={onClose}
      activeCount={activeCount}
      hasActiveFilters={catalogFiltersActive(filters)}
      onClear={() => onFiltersChange(DEFAULT_CATALOG_FILTERS)}
      portalName="catalog-filter-sheet"
    >
      <FilterAccordionGroup key={accordionKey} defaultOpen={defaultOpen}>
        {MOBILE_FILTER_SEGMENTS.map((segment) => (
          <FilterAccordionSection
            key={segment.id}
            value={segment.id}
            label={segment.label}
            summary={catalogFilterSegmentSummary(segment.id, filters)}
            active={catalogFilterSegmentActive(segment.id, filters)}
          >
            <CatalogFilterSegmentPanel
              segment={segment.id}
              filters={filters}
              onFiltersChange={onFiltersChange}
              presentation="mobile"
            />
          </FilterAccordionSection>
        ))}
      </FilterAccordionGroup>
    </MobileFilterSheet>
  );
}

export function CatalogFilterTrigger({
  filters,
  onPress,
  compact = false,
  mobile = false,
}: {
  filters: CatalogFilters;
  onPress: () => void;
  compact?: boolean;
  mobile?: boolean;
}) {
  const activeCount = countCatalogFilters(filters);
  const filterActive = activeCount > 0;

  return (
    <CatalogToolbarButton
      icon={SlidersHorizontalIcon}
      onPress={onPress}
      accessibilityLabel="Open filters"
      active={filterActive}
      mobile={mobile}
      label={compact ? undefined : 'Filters'}
      badge={
        filterActive ? (
          activeCount === 1 ? (
            <CatalogToolbarBadgeDot />
          ) : (
            <View className="size-5 items-center justify-center rounded-full bg-primary">
              <Text className="font-mono text-[11px] font-semibold text-primary-foreground">
                {activeCount}
              </Text>
            </View>
          )
        ) : null
      }
    />
  );
}

export function CatalogActiveFilterChips({
  filters,
  onFiltersChange,
}: {
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
}) {
  const { colorOptions } = useCatalogFilterOptions();
  const colorByName = useMemo(
    () => new Map(colorOptions.map((color) => [color.name, color])),
    [colorOptions]
  );

  if (!catalogFiltersActive(filters)) return null;

  return (
    <View className="shrink-0">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerClassName="flex-row items-center gap-2 pr-1"
      >
        {catalogFilterChips(filters).map((chip) => (
          <FilterKeywordChip
            key={chip.id}
            label={chip.label}
            keywordBase={chip.keywordBase}
            trailing={
              chip.colorNames && chip.colorNames.length > 0 ? (
                <View className="flex-row items-center gap-2">
                  {chip.colorNames.map((name) => (
                    <Pressable
                      key={name}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${name} color filter`}
                      className="flex-row items-center gap-1 rounded-md px-1 py-0.5 active:bg-accent/80"
                      onPress={() => {
                        hapticPress();
                        onFiltersChange({
                          ...filters,
                          colors: filters.colors.filter((color) => color !== name),
                        });
                      }}
                    >
                      <DomainIcon
                        name={name}
                        imageUrl={colorByName.get(name)?.imageUrl}
                        size={14}
                      />
                      <Text className="text-[11px] font-semibold text-muted-foreground">
                        {name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : undefined
            }
            onClear={() => onFiltersChange(chip.clear())}
          />
        ))}
      </ScrollView>
    </View>
  );
}
