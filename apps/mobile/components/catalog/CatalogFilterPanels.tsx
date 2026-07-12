import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DomainIcon, RarityIcon, TypeIcon } from '@/components/riftbound/CardIcons';
import {
  FilterChipGrid,
  FilterOptionChip,
} from '@/components/filters/MobileFilterSheet';
import {
  FilterStatChip,
  FilterToggleRow,
} from '@/components/filters/FilterPrimitives';
import { Text } from '@/components/ui/text';
import {
  CATALOG_ENERGY_VALUES,
  CATALOG_MIGHT_VALUES,
  CATALOG_POWER_VALUES,
  isCatalogBrowsableType,
  sanitizeCatalogFilters,
  type CatalogFilterSegment,
  type CatalogFilters,
} from '@/constants/catalogFilters';
import { prefetchCatalogFilters, useFiltersData } from '@/hooks/useFiltersData';

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export type CatalogFilterPresentation = 'list' | 'mobile';

export function useCatalogFilterOptions() {
  const queryClient = useQueryClient();
  const filtersQuery = useFiltersData();

  useEffect(() => {
    void prefetchCatalogFilters(queryClient);
  }, [queryClient]);

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

  return {
    isLoading,
    colorOptions,
    setOptions,
    typeOptions,
    supertypeOptions: snapshot?.supertypes ?? [],
    variantOptions: snapshot?.variants ?? [],
    rarityOptions: snapshot?.rarities ?? [],
  };
}

interface CatalogFilterSegmentPanelProps {
  segment: CatalogFilterSegment;
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
  compact?: boolean;
  presentation?: CatalogFilterPresentation;
}

export function CatalogFilterSegmentPanel({
  segment,
  filters,
  onFiltersChange,
  compact = false,
  presentation = 'list',
}: CatalogFilterSegmentPanelProps) {
  const {
    isLoading,
    colorOptions,
    setOptions,
    typeOptions,
    supertypeOptions,
    variantOptions,
    rarityOptions,
  } = useCatalogFilterOptions();

  const update = (patch: Partial<CatalogFilters>) => {
    onFiltersChange(sanitizeCatalogFilters({ ...filters, ...patch }));
  };

  const isMobile = presentation === 'mobile';

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator />
        <Text className="mt-3 text-sm text-archive-subtle">Loading filter options…</Text>
      </View>
    );
  }

  switch (segment) {
    case 'collection':
      return (
        <View className="gap-0.5">
          <FilterToggleRow
            label="All cards"
            subtitle="No collection filter"
            active={filters.collection === 'all'}
            onPress={() => update({ collection: 'all' })}
            compact={compact}
          />
          <FilterToggleRow
            label="Owned"
            subtitle="Cards in your collection"
            active={filters.collection === 'owned'}
            onPress={() =>
              update({
                collection: filters.collection === 'owned' ? 'all' : 'owned',
              })
            }
            compact={compact}
          />
          <FilterToggleRow
            label="Wishlist"
            subtitle="Cards you do not own yet"
            active={filters.collection === 'wishlist'}
            onPress={() =>
              update({
                collection: filters.collection === 'wishlist' ? 'all' : 'wishlist',
              })
            }
            compact={compact}
          />
        </View>
      );

    case 'colors':
      if (colorOptions.length === 0) {
        return (
          <Text className="py-6 text-center text-sm text-archive-subtle">
            No color filters available.
          </Text>
        );
      }
      if (isMobile) {
        return (
          <FilterChipGrid>
            {colorOptions.map((color) => (
              <FilterOptionChip
                key={color.id}
                label={color.name}
                active={filters.colors.includes(color.name)}
                onPress={() => update({ colors: toggleValue(filters.colors, color.name) })}
                leading={<DomainIcon name={color.name} imageUrl={color.imageUrl} size={18} />}
              />
            ))}
          </FilterChipGrid>
        );
      }
      return (
        <View className="gap-0.5">
          {colorOptions.map((color) => (
            <FilterToggleRow
              key={color.id}
              label={color.name}
              subtitle={`${color.count.toLocaleString()} cards`}
              active={filters.colors.includes(color.name)}
              onPress={() => update({ colors: toggleValue(filters.colors, color.name) })}
              leading={<DomainIcon name={color.name} imageUrl={color.imageUrl} size={20} />}
              compact={compact}
            />
          ))}
        </View>
      );

    case 'sets':
      if (setOptions.length === 0) {
        return (
          <Text className="py-6 text-center text-sm text-archive-subtle">
            No set filters available.
          </Text>
        );
      }
      if (isMobile) {
        return (
          <FilterChipGrid>
            {setOptions.map((set) => (
              <FilterOptionChip
                key={set.code}
                label={set.code}
                active={filters.sets.includes(set.code)}
                onPress={() => update({ sets: toggleValue(filters.sets, set.code) })}
                accessibilityLabel={`${set.name} (${set.code})`}
              />
            ))}
          </FilterChipGrid>
        );
      }
      return (
        <View className="gap-0.5">
          {setOptions.map((set) => (
            <FilterToggleRow
              key={set.code}
              label={set.name}
              subtitle={`${set.code} · ${set.count.toLocaleString()} printings`}
              active={filters.sets.includes(set.code)}
              onPress={() => update({ sets: toggleValue(filters.sets, set.code) })}
              compact={compact}
            />
          ))}
        </View>
      );

    case 'types':
      if (isMobile) {
        return (
          <FilterChipGrid>
            {typeOptions.map((type) => (
              <FilterOptionChip
                key={type.id}
                label={type.name}
                active={filters.types.includes(type.name)}
                onPress={() => update({ types: toggleValue(filters.types, type.name) })}
                leading={<TypeIcon type={type.name} size={16} tone="foreground" />}
              />
            ))}
          </FilterChipGrid>
        );
      }
      return (
        <View className="gap-0.5">
          {typeOptions.map((type) => (
            <FilterToggleRow
              key={type.id}
              label={type.name}
              subtitle={`${type.count.toLocaleString()} cards`}
              active={filters.types.includes(type.name)}
              onPress={() => update({ types: toggleValue(filters.types, type.name) })}
              leading={<TypeIcon type={type.name} size={20} tone="foreground" />}
              compact={compact}
            />
          ))}
        </View>
      );

    case 'supertypes':
      if (supertypeOptions.length === 0) {
        return (
          <Text className="py-6 text-center text-sm text-archive-subtle">
            No supertype filters available.
          </Text>
        );
      }
      if (isMobile) {
        return (
          <FilterChipGrid>
            {supertypeOptions.map((entry) => (
              <FilterOptionChip
                key={entry.id}
                label={entry.name}
                active={filters.supertypes.includes(entry.name)}
                onPress={() =>
                  update({ supertypes: toggleValue(filters.supertypes, entry.name) })
                }
              />
            ))}
          </FilterChipGrid>
        );
      }
      return (
        <View className="gap-0.5">
          {supertypeOptions.map((entry) => (
            <FilterToggleRow
              key={entry.id}
              label={entry.name}
              subtitle={`${entry.count.toLocaleString()} cards`}
              active={filters.supertypes.includes(entry.name)}
              onPress={() =>
                update({ supertypes: toggleValue(filters.supertypes, entry.name) })
              }
              compact={compact}
            />
          ))}
        </View>
      );

    case 'variants':
      if (isMobile) {
        return (
          <FilterChipGrid>
            {variantOptions.map((entry) => (
              <FilterOptionChip
                key={entry.id}
                label={entry.name}
                active={filters.variants.includes(entry.name)}
                onPress={() => update({ variants: toggleValue(filters.variants, entry.name) })}
              />
            ))}
          </FilterChipGrid>
        );
      }
      return (
        <View className="gap-0.5">
          {variantOptions.map((entry) => (
            <FilterToggleRow
              key={entry.id}
              label={entry.name}
              subtitle={`${entry.count.toLocaleString()} printings`}
              active={filters.variants.includes(entry.name)}
              onPress={() => update({ variants: toggleValue(filters.variants, entry.name) })}
              compact={compact}
            />
          ))}
        </View>
      );

    case 'rarities':
      if (isMobile) {
        return (
          <FilterChipGrid>
            {rarityOptions.map((entry) => (
              <FilterOptionChip
                key={entry.id}
                label={entry.name}
                active={filters.rarities.includes(entry.name)}
                onPress={() => update({ rarities: toggleValue(filters.rarities, entry.name) })}
                leading={<RarityIcon rarity={entry.name} size={16} />}
              />
            ))}
          </FilterChipGrid>
        );
      }
      return (
        <View className="gap-0.5">
          {rarityOptions.map((entry) => (
            <FilterToggleRow
              key={entry.id}
              label={entry.name}
              subtitle={`${entry.count.toLocaleString()} printings`}
              active={filters.rarities.includes(entry.name)}
              onPress={() => update({ rarities: toggleValue(filters.rarities, entry.name) })}
              leading={<RarityIcon rarity={entry.name} size={18} />}
              compact={compact}
            />
          ))}
        </View>
      );

    case 'stats':
      return (
        <View className="gap-4">
          <View>
            <Text className="mb-2 text-sm font-semibold text-foreground">Energy</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATALOG_ENERGY_VALUES.map((value) => (
                <FilterStatChip
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
                <FilterStatChip
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
                <FilterStatChip
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
          {isMobile ? (
            <FilterChipGrid>
              <FilterOptionChip
                label="Hide tokens"
                active={filters.excludeTokens}
                onPress={() => update({ excludeTokens: !filters.excludeTokens })}
              />
              <FilterOptionChip
                label="Tokens only"
                active={filters.tokensOnly}
                onPress={() => update({ tokensOnly: !filters.tokensOnly })}
              />
            </FilterChipGrid>
          ) : (
            <>
              <FilterToggleRow
                label="Hide tokens"
                subtitle="Remove token markers from results"
                active={filters.excludeTokens}
                onPress={() => update({ excludeTokens: !filters.excludeTokens })}
                compact={compact}
              />
              <FilterToggleRow
                label="Tokens only"
                subtitle="Show only token markers (Buff, XP Tracker, etc.)"
                active={filters.tokensOnly}
                onPress={() => update({ tokensOnly: !filters.tokensOnly })}
                compact={compact}
              />
            </>
          )}
        </View>
      );

    default:
      return null;
  }
}

export function CatalogFilterLoadingState() {
  return (
    <View className="items-center py-10">
      <ActivityIndicator />
      <Text className="mt-3 text-sm text-archive-subtle">Loading filter options…</Text>
    </View>
  );
}
