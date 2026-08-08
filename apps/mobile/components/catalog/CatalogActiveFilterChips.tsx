import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { CatalogActiveFilterChip } from '@/components/catalog/CatalogActiveFilterChip';
import { useCatalogFilterOptions } from '@/components/catalog/CatalogFilterPanels';
import {
  catalogFilterChips,
  catalogFiltersActive,
  type CatalogFilterChip,
  type CatalogFilters,
} from '@/constants/catalogFilters';
import { useReduceMotion } from '@/hooks/useReduceMotion';

interface CatalogActiveFilterChipsProps {
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
  /**
   * scroll — horizontal row in a bordered shell (standalone contexts)
   * inline — flex-wrap row directly under filter controls
   * wrap — full-width tray with top border (legacy shell sections)
   */
  layout?: 'scroll' | 'inline' | 'wrap';
}

export function CatalogActiveFilterChips({
  filters,
  onFiltersChange,
  layout = 'scroll',
}: CatalogActiveFilterChipsProps) {
  const reduceMotion = useReduceMotion();
  const { colorOptions } = useCatalogFilterOptions();
  const colorByName = useMemo(
    () => new Map(colorOptions.map((color) => [color.name, color])),
    [colorOptions]
  );
  const chips = useMemo(
    () => (catalogFiltersActive(filters) ? catalogFilterChips(filters) : []),
    [filters]
  );

  const chipEnter = reduceMotion ? undefined : FadeIn.duration(160);
  const chipExit = reduceMotion ? undefined : FadeOut.duration(120);
  const chipLayout = reduceMotion ? undefined : LinearTransition.duration(180);
  const compact = layout === 'scroll';

  const chipProps = useCallback(
    (chip: CatalogFilterChip) => ({
      chip,
      colorImageByName: colorByName,
      compact,
      onClear: () => onFiltersChange(chip.clear()),
      onRemoveColor: (name: string) =>
        onFiltersChange({
          ...filters,
          colors: filters.colors.filter((color) => color !== name),
        }),
    }),
    [colorByName, compact, filters, onFiltersChange]
  );

  const renderScrollChip = useCallback<ListRenderItem<CatalogFilterChip>>(
    ({ item: chip }) => (
      <Animated.View entering={chipEnter} exiting={chipExit} layout={chipLayout}>
        <CatalogActiveFilterChip {...chipProps(chip)} />
      </Animated.View>
    ),
    [chipEnter, chipExit, chipLayout, chipProps]
  );

  const renderWrapChip = useCallback(
    (chip: CatalogFilterChip) => (
      <Animated.View
        key={chip.id}
        entering={chipEnter}
        exiting={chipExit}
        layout={chipLayout}
      >
        <CatalogActiveFilterChip {...chipProps(chip)} />
      </Animated.View>
    ),
    [chipEnter, chipExit, chipLayout, chipProps]
  );

  if (!catalogFiltersActive(filters)) return null;

  if (layout === 'inline' || layout === 'wrap') {
    return (
      <Animated.View
        className={
          layout === 'wrap'
            ? 'border-t border-border/50 bg-card-panel/30 px-3 py-2.5'
            : 'pt-1.5'
        }
        entering={chipEnter}
        exiting={chipExit}
        layout={chipLayout}
      >
        <View className="flex-row flex-wrap items-center gap-2">
          {chips.map(renderWrapChip)}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      className="shrink-0 overflow-hidden rounded-lg border border-border bg-card px-2 py-2"
      entering={chipEnter}
      exiting={chipExit}
      layout={chipLayout}
    >
      <FlashList
        horizontal
        data={chips}
        keyExtractor={(chip) => chip.id}
        renderItem={renderScrollChip}
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerClassName="flex-row items-center gap-2 pr-1"
      />
    </Animated.View>
  );
}
