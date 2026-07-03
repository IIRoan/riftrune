import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet';
import { Text } from '@/components/ui/text';

export const FILTER_GROUPS = [
  { label: 'Collection', options: ['Owned', 'Wishlist'] },
  {
    label: 'Domain',
    options: ['Fury', 'Calm', 'Mind', 'Body', 'Chaos', 'Order'],
  },
  {
    label: 'Type',
    options: ['Unit', 'Spell', 'Gear', 'Legend', 'Battlefield', 'Rune'],
  },
  {
    label: 'Rarity',
    options: ['Common', 'Uncommon', 'Rare', 'Epic', 'Showcase'],
  },
] as const;

export const ALL_CARDS_FILTER = 'All cards';

interface FilterSheetProps {
  visible: boolean;
  activeFilter: string;
  onClose: () => void;
  onFilterChange: (filter: string) => void;
}

export function FilterSheet({
  visible,
  activeFilter,
  onClose,
  onFilterChange,
}: FilterSheetProps) {
  const groups = useMemo(() => FILTER_GROUPS, []);

  return (
    <BottomSheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheetPortal>
        <BottomSheetOverlay />
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Filters</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetBody>
            <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
              <FilterOption
                value={ALL_CARDS_FILTER}
                active={activeFilter === ALL_CARDS_FILTER}
                onSelect={() => {
                  onFilterChange(ALL_CARDS_FILTER);
                  onClose();
                }}
              />
              {groups.map((group) => (
                <View key={group.label} className="mt-3">
                  <Text className="px-1 pb-1 pt-2 text-[11px] font-semibold text-muted-foreground">
                    {group.label}
                  </Text>
                  {group.options.map((option) => (
                    <FilterOption
                      key={option}
                      value={option}
                      active={activeFilter === option}
                      onSelect={() => {
                        onFilterChange(option);
                        onClose();
                      }}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}

function FilterOption({
  value,
  active,
  onSelect,
}: {
  value: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      className="flex-row items-center justify-between rounded-lg px-2.5 py-2.5 active:bg-accent"
      onPress={onSelect}
    >
      <Text className="text-sm font-medium text-foreground">{value}</Text>
      {active ? (
        <Ionicons name="checkmark" size={18} className="text-archive-accent-text" />
      ) : null}
    </Pressable>
  );
}

export function FilterTrigger({
  activeFilter,
  onPress,
}: {
  activeFilter: string;
  onPress: () => void;
}) {
  const filterActive = activeFilter !== ALL_CARDS_FILTER;

  return (
    <Pressable
      className="h-12 flex-row items-center gap-2 rounded-xl border border-border bg-card px-4 active:opacity-80"
      onPress={onPress}
      accessibilityLabel="Open filters"
    >
      <Ionicons name="options-outline" size={16} className="text-muted-foreground" />
      <Text className="text-sm font-semibold text-foreground">Filters</Text>
      {filterActive ? (
        <View className="size-5 items-center justify-center rounded-full bg-primary">
          <Text className="font-mono text-[11px] font-semibold text-primary-foreground">1</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-down" size={16} className="text-muted-foreground" />
    </Pressable>
  );
}

export function ActiveFilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <Pressable
      className="h-12 flex-row items-center gap-1.5 rounded-xl bg-card-panel px-3.5 active:opacity-80"
      onPress={onClear}
      accessibilityLabel="Clear filter"
    >
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <Text className="text-muted-foreground">×</Text>
    </Pressable>
  );
}

/** Client-side filter for card list items. */
export function matchesCatalogFilter(
  card: {
    colors: string[];
    type: string;
    rarity: string;
    variantNumber: string;
    printings?: { variantNumber: string }[];
  },
  filter: string,
  collectionByVariant: ReadonlyMap<string, { quantity: number }>
): boolean {
  if (filter === ALL_CARDS_FILTER) return true;

  const owned = (card.printings ?? [{ variantNumber: card.variantNumber }]).reduce(
    (sum, p) => sum + (collectionByVariant.get(p.variantNumber)?.quantity ?? 0),
    0
  );

  if (filter === 'Owned') return owned > 0;
  if (filter === 'Wishlist') return owned === 0;

  const domains = FILTER_GROUPS[1].options as readonly string[];
  if (domains.includes(filter as (typeof domains)[number])) {
    return card.colors.some((c) => c.includes(filter));
  }

  const types = FILTER_GROUPS[2].options as readonly string[];
  if (types.includes(filter as (typeof types)[number])) {
    return card.type === filter;
  }

  const rarities = FILTER_GROUPS[3].options as readonly string[];
  if (rarities.includes(filter as (typeof rarities)[number])) {
    return card.rarity === filter;
  }

  return true;
}
