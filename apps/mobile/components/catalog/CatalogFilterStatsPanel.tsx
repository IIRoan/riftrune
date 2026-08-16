import { View } from 'react-native';
import {
  FilterChipGrid,
  FilterOptionChip,
} from '@/components/filters/MobileFilterSheet';
import { FilterStatChip, FilterToggleRow } from '@/components/filters/FilterPrimitives';
import { Text } from '@/components/ui/text';
import type { CatalogFilterSegmentCommonProps } from '@/components/catalog/catalogFilterPanels.shared';
import {
  CATALOG_ENERGY_VALUES,
  CATALOG_MIGHT_VALUES,
  CATALOG_POWER_VALUES,
} from '@/constants/catalogFilters';

export function CatalogFilterStatsPanel({
  filters,
  compact,
  presentation,
  onUpdate,
}: CatalogFilterSegmentCommonProps) {
  return (
    <View className="gap-4">
      <View>
        <Text className="mb-2 font-mono text-[12px] font-normal uppercase tracking-[-0.24px] text-muted-foreground">
          Energy
        </Text>
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
                  onUpdate(next);
                  return;
                }
                onUpdate({ energy: value });
              }}
            />
          ))}
        </View>
      </View>
      <View>
        <Text className="mb-2 font-mono text-[12px] font-normal uppercase tracking-[-0.24px] text-muted-foreground">
          Power
        </Text>
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
                  onUpdate(next);
                  return;
                }
                onUpdate({ power: value });
              }}
            />
          ))}
        </View>
      </View>
      <View>
        <Text className="mb-2 font-mono text-[12px] font-normal uppercase tracking-[-0.24px] text-muted-foreground">
          Might
        </Text>
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
                  onUpdate(next);
                  return;
                }
                onUpdate({ might: value });
              }}
            />
          ))}
        </View>
      </View>
      {presentation === 'mobile' ? (
        <FilterChipGrid>
          <FilterOptionChip
            label="Hide tokens"
            active={filters.excludeTokens}
            onPress={() => onUpdate({ excludeTokens: !filters.excludeTokens })}
          />
          <FilterOptionChip
            label="Tokens only"
            active={filters.tokensOnly}
            onPress={() => onUpdate({ tokensOnly: !filters.tokensOnly })}
          />
        </FilterChipGrid>
      ) : (
        <>
          <FilterToggleRow
            label="Hide tokens"
            subtitle="Remove token markers from results"
            active={filters.excludeTokens}
            onPress={() => onUpdate({ excludeTokens: !filters.excludeTokens })}
            compact={compact}
          />
          <FilterToggleRow
            label="Tokens only"
            subtitle="Show only token markers (Buff, XP Tracker, etc.)"
            active={filters.tokensOnly}
            onPress={() => onUpdate({ tokensOnly: !filters.tokensOnly })}
            compact={compact}
          />
        </>
      )}
    </View>
  );
}
