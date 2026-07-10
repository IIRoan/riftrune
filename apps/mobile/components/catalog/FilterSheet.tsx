import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import {
  CatalogToolbarBadgeDot,
  CatalogToolbarButton,
} from '@/components/catalog/CatalogToolbarButton';
import { DomainIcon, RarityIcon, TypeIcon } from '@/components/riftbound/CardIcons';
import { FilterKeywordChip } from '@/components/riftbound/RiftboundBadges';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import {
  CATALOG_ENERGY_VALUES,
  CATALOG_FILTER_SEGMENTS,
  CATALOG_MIGHT_VALUES,
  CATALOG_POWER_VALUES,
  catalogFilterChips,
  catalogFilterSegmentActive,
  catalogFiltersActive,
  countCatalogFilters,
  DEFAULT_CATALOG_FILTERS,
  isCatalogBrowsableType,
  sanitizeCatalogFilters,
  type CatalogFilterSegment,
  type CatalogFilters,
} from '@/constants/catalogFilters';
import { prefetchCatalogFilters, useFiltersData } from '@/hooks/useFiltersData';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { cn } from '@/lib/utils';

interface CatalogFilterSheetProps {
  visible: boolean;
  filters: CatalogFilters;
  onClose: () => void;
  onFiltersChange: (filters: CatalogFilters) => void;
}

function ToggleRow({
  label,
  subtitle,
  active,
  onPress,
  leading,
}: {
  label: string;
  subtitle?: string;
  active: boolean;
  onPress: () => void;
  leading?: ReactNode;
}) {
  return (
    <Pressable
      className={cn(
        'min-h-12 flex-row items-center justify-between rounded-lg px-3 py-2.5 active:opacity-90',
        active ? 'bg-foreground/8' : 'bg-transparent'
      )}
      onPress={onPress}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5 pr-3">
        {leading}
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-foreground">{label}</Text>
          {subtitle ? (
            <Text className="mt-0.5 text-[12px] text-archive-subtle">{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {active ? (
        <ThemedIonicon name="checkmark-circle" size={20} color="archive-accent-text" />
      ) : (
        <View className="size-5 rounded-full border border-archive-subtle/60" />
      )}
    </Pressable>
  );
}

function StatChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={cn(
        'min-w-[44px] items-center justify-center rounded-lg border px-3 py-2 active:opacity-90',
        active ? 'border-foreground bg-foreground' : 'border-border/70 bg-transparent'
      )}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        className={cn(
          'font-mono text-sm font-semibold',
          active ? 'text-background' : 'text-archive-subtle'
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const FILTER_TAB_ROWS: CatalogFilterSegment[][] = [
  ['collection', 'colors', 'sets', 'types'],
  ['supertypes', 'variants', 'rarities', 'stats'],
];

function FilterSegmentBar({
  activeSegment,
  filters,
  onSegmentChange,
}: {
  activeSegment: CatalogFilterSegment;
  filters: CatalogFilters;
  onSegmentChange: (segment: CatalogFilterSegment) => void;
}) {
  const segmentById = useMemo(
    () => new Map(CATALOG_FILTER_SEGMENTS.map((segment) => [segment.id, segment])),
    []
  );

  return (
    <View className="mb-3 border-b border-border pb-2">
      {FILTER_TAB_ROWS.map((row, rowIndex) => (
        <View key={row.join('-')} className={cn('flex-row', rowIndex > 0 && 'mt-0.5')}>
          {row.map((segmentId) => {
            const segment = segmentById.get(segmentId);
            if (!segment) return null;
            const active = activeSegment === segment.id;
            const hasValue = catalogFilterSegmentActive(segment.id, filters);
            return (
              <Pressable
                key={segment.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                className="relative min-h-11 flex-1 items-center justify-center px-1 py-2 active:opacity-90"
                onPress={() => onSegmentChange(segment.id)}
              >
                <Text
                  className={cn(
                    'text-center text-[11px] font-semibold leading-tight',
                    active ? 'text-foreground' : 'text-archive-subtle'
                  )}
                  numberOfLines={1}
                >
                  {segment.label}
                </Text>
                {active ? (
                  <View className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-foreground" />
                ) : null}
                {hasValue && !active ? (
                  <View className="absolute right-1 top-1.5 size-1.5 rounded-full bg-primary" />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function SegmentPanel({
  visible,
  children,
}: {
  visible: boolean;
  children: ReactNode;
}) {
  return (
    <View className={cn('gap-1', !visible && 'hidden')} pointerEvents={visible ? 'auto' : 'none'}>
      {children}
    </View>
  );
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function CatalogFilterSheet({
  visible,
  filters,
  onClose,
  onFiltersChange,
}: CatalogFilterSheetProps) {
  const reduceMotion = useReduceMotion();
  const snapPoints = reduceMotion ? ['92%'] : ['72%', '92%'];
  const [activeSegment, setActiveSegment] = useState<CatalogFilterSegment>('colors');
  const queryClient = useQueryClient();
  const filtersQuery = useFiltersData();

  useEffect(() => {
    void prefetchCatalogFilters(queryClient);
  }, [queryClient]);

  useEffect(() => {
    if (!visible) return;
    void prefetchCatalogFilters(queryClient);
  }, [visible, queryClient]);

  const update = (patch: Partial<CatalogFilters>) => {
    onFiltersChange(sanitizeCatalogFilters({ ...filters, ...patch }));
  };

  const snapshot = filtersQuery.data;
  const isLoading = !snapshot && (filtersQuery.isLoading || filtersQuery.isFetching);

  const colorOptions = useMemo(
    () =>
      (snapshot?.colors ?? []).map((entry) => ({
        id: entry.id,
        name: entry.name,
        count: entry.count,
        imageUrl: entry.imageUrl,
      })),
    [snapshot?.colors]
  );

  const setOptions = useMemo(
    () =>
      (snapshot?.sets ?? [])
        .filter((entry) => (entry.printCount ?? entry.count) > 0)
        .map((entry) => ({
          code: entry.code ?? entry.id.toUpperCase(),
          name: entry.name,
          count: entry.printCount ?? entry.count,
        })),
    [snapshot?.sets]
  );

  const typeOptions = useMemo(
    () => (snapshot?.types ?? []).filter((entry) => isCatalogBrowsableType(entry.name)),
    [snapshot?.types]
  );

  const supertypeOptions = snapshot?.supertypes ?? [];
  const variantOptions = snapshot?.variants ?? [];
  const rarityOptions = snapshot?.rarities ?? [];

  const activeCount = countCatalogFilters(filters);

  return (
    <BottomSheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheetPortal name="catalog-filter-sheet">
        <BottomSheetOverlay />
        <BottomSheetContent
          snapPoints={snapPoints}
          defaultSnapIndex={0}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
          className="bg-card-panel"
        >
          <BottomSheetHeader className="border-b border-border bg-card-panel">
            <BottomSheetTitle>Filters</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetScrollView
            contentContainerClassName="px-4 pb-4 pt-3"
            showsVerticalScrollIndicator={false}
          >
            <FilterSegmentBar
              activeSegment={activeSegment}
              filters={filters}
              onSegmentChange={setActiveSegment}
            />
            {isLoading ? (
              <View className="items-center py-10">
                <ActivityIndicator />
                <Text className="mt-3 text-sm text-archive-subtle">Loading filter options…</Text>
              </View>
            ) : (
              <>
                <SegmentPanel visible={activeSegment === 'collection'}>
                  <ToggleRow
                    label="All cards"
                    subtitle="No collection filter"
                    active={filters.collection === 'all'}
                    onPress={() => update({ collection: 'all' })}
                  />
                  <ToggleRow
                    label="Owned"
                    subtitle="Cards in your collection"
                    active={filters.collection === 'owned'}
                    onPress={() =>
                      update({
                        collection: filters.collection === 'owned' ? 'all' : 'owned',
                      })
                    }
                  />
                  <ToggleRow
                    label="Wishlist"
                    subtitle="Cards you do not own yet"
                    active={filters.collection === 'wishlist'}
                    onPress={() =>
                      update({
                        collection: filters.collection === 'wishlist' ? 'all' : 'wishlist',
                      })
                    }
                  />
                </SegmentPanel>

                <SegmentPanel visible={activeSegment === 'colors'}>
                  {colorOptions.length === 0 ? (
                    <Text className="py-6 text-center text-sm text-archive-subtle">
                      No color filters available.
                    </Text>
                  ) : (
                    colorOptions.map((color) => (
                      <ToggleRow
                        key={color.id}
                        label={color.name}
                        subtitle={`${color.count.toLocaleString()} cards`}
                        active={filters.colors.includes(color.name)}
                        onPress={() => update({ colors: toggleValue(filters.colors, color.name) })}
                        leading={
                          <DomainIcon name={color.name} imageUrl={color.imageUrl} size={20} />
                        }
                      />
                    ))
                  )}
                </SegmentPanel>

                <SegmentPanel visible={activeSegment === 'sets'}>
                  {setOptions.length === 0 ? (
                    <Text className="py-6 text-center text-sm text-archive-subtle">
                      No set filters available.
                    </Text>
                  ) : (
                    setOptions.map((set) => (
                      <ToggleRow
                        key={set.code}
                        label={set.name}
                        subtitle={`${set.code} · ${set.count.toLocaleString()} printings`}
                        active={filters.sets.includes(set.code)}
                        onPress={() => update({ sets: toggleValue(filters.sets, set.code) })}
                      />
                    ))
                  )}
                </SegmentPanel>

                <SegmentPanel visible={activeSegment === 'types'}>
                  {typeOptions.map((type) => (
                    <ToggleRow
                      key={type.id}
                      label={type.name}
                      subtitle={`${type.count.toLocaleString()} cards`}
                      active={filters.types.includes(type.name)}
                      onPress={() => update({ types: toggleValue(filters.types, type.name) })}
                      leading={<TypeIcon type={type.name} size={20} tone="foreground" />}
                    />
                  ))}
                </SegmentPanel>

                <SegmentPanel visible={activeSegment === 'supertypes'}>
                  {supertypeOptions.length === 0 ? (
                    <Text className="py-6 text-center text-sm text-archive-subtle">
                      No supertype filters available.
                    </Text>
                  ) : (
                    supertypeOptions.map((entry) => (
                      <ToggleRow
                        key={entry.id}
                        label={entry.name}
                        subtitle={`${entry.count.toLocaleString()} cards`}
                        active={filters.supertypes.includes(entry.name)}
                        onPress={() =>
                          update({ supertypes: toggleValue(filters.supertypes, entry.name) })
                        }
                      />
                    ))
                  )}
                </SegmentPanel>

                <SegmentPanel visible={activeSegment === 'variants'}>
                  {variantOptions.map((entry) => (
                    <ToggleRow
                      key={entry.id}
                      label={entry.name}
                      subtitle={`${entry.count.toLocaleString()} printings`}
                      active={filters.variants.includes(entry.name)}
                      onPress={() => update({ variants: toggleValue(filters.variants, entry.name) })}
                    />
                  ))}
                </SegmentPanel>

                <SegmentPanel visible={activeSegment === 'rarities'}>
                  {rarityOptions.map((entry) => (
                    <ToggleRow
                      key={entry.id}
                      label={entry.name}
                      subtitle={`${entry.count.toLocaleString()} printings`}
                      active={filters.rarities.includes(entry.name)}
                      onPress={() => update({ rarities: toggleValue(filters.rarities, entry.name) })}
                      leading={<RarityIcon rarity={entry.name} size={18} />}
                    />
                  ))}
                </SegmentPanel>

                <SegmentPanel visible={activeSegment === 'stats'}>
                  <View className="gap-5">
                    <View>
                      <Text className="mb-2 text-sm font-semibold text-foreground">Energy</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {CATALOG_ENERGY_VALUES.map((value) => (
                          <StatChip
                            key={`energy-${value}`}
                            label={String(value)}
                            active={filters.energy === value}
                            onPress={() => {
                              if (filters.energy === value) {
                                const next = { ...filters };
                                delete next.energy;
                                update(next);
                                return;
                              }
                              update({ energy: value });
                            }}
                          />
                        ))}
                      </View>
                    </View>
                    <View>
                      <Text className="mb-2 text-sm font-semibold text-foreground">Power</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {CATALOG_POWER_VALUES.map((value) => (
                          <StatChip
                            key={`power-${value}`}
                            label={String(value)}
                            active={filters.power === value}
                            onPress={() => {
                              if (filters.power === value) {
                                const next = { ...filters };
                                delete next.power;
                                update(next);
                                return;
                              }
                              update({ power: value });
                            }}
                          />
                        ))}
                      </View>
                    </View>
                    <View>
                      <Text className="mb-2 text-sm font-semibold text-foreground">Might</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {CATALOG_MIGHT_VALUES.map((value) => (
                          <StatChip
                            key={`might-${value}`}
                            label={String(value)}
                            active={filters.might === value}
                            onPress={() => {
                              if (filters.might === value) {
                                const next = { ...filters };
                                delete next.might;
                                update(next);
                                return;
                              }
                              update({ might: value });
                            }}
                          />
                        ))}
                      </View>
                    </View>
                    <ToggleRow
                      label="Hide tokens"
                      subtitle="Remove token markers from results"
                      active={filters.excludeTokens}
                      onPress={() => update({ excludeTokens: !filters.excludeTokens })}
                    />
                    <ToggleRow
                      label="Tokens only"
                      subtitle="Show only token markers (Buff, XP Tracker, etc.)"
                      active={filters.tokensOnly}
                      onPress={() => update({ tokensOnly: !filters.tokensOnly })}
                    />
                  </View>
                </SegmentPanel>
              </>
            )}
          </BottomSheetScrollView>
          <BottomSheetFooter className="border-t border-border bg-card-panel px-4 pb-4 pt-3">
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => onFiltersChange(DEFAULT_CATALOG_FILTERS)}
              >
                <ButtonText>Clear all</ButtonText>
              </Button>
              <Button className="flex-1" onPress={onClose}>
                <ButtonText>
                  {catalogFiltersActive(filters)
                    ? `Show cards (${activeCount})`
                    : 'Show cards'}
                </ButtonText>
              </Button>
            </View>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
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
      icon="options-outline"
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
  if (!catalogFiltersActive(filters)) return null;

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      {catalogFilterChips(filters).map((chip) => (
        <FilterKeywordChip
          key={chip.id}
          label={chip.label}
          keywordBase={chip.keywordBase}
          onClear={() => onFiltersChange(chip.clear())}
        />
      ))}
    </View>
  );
}

/** @deprecated Use CatalogFilterSheet */
export const FilterSheet = CatalogFilterSheet;
/** @deprecated Use CatalogFilterTrigger */
export const FilterTrigger = CatalogFilterTrigger;
/** @deprecated Use CatalogActiveFilterChips */
export const ActiveFilterChip = CatalogActiveFilterChips;
