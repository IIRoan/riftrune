import { Pressable, View } from 'react-native';
import {
  CatalogToolbarBadgeDot,
  CatalogToolbarButton,
} from '@/components/catalog/CatalogToolbarButton';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import {
  ALL_CARDS_FILTER,
  FILTER_GROUPS,
  matchesCatalogFilter,
} from '@/utils/catalogFilter';

export { ALL_CARDS_FILTER, FILTER_GROUPS, matchesCatalogFilter };

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
  const reduceMotion = useReduceMotion();
  const snapPoints = reduceMotion ? ['92%'] : ['58%', '92%'];
  const groups = FILTER_GROUPS;

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
        >
          <BottomSheetHeader>
            <BottomSheetTitle>Filters</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetScrollView
            contentContainerClassName="px-4 pb-6"
            showsVerticalScrollIndicator={false}
          >
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
          </BottomSheetScrollView>
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
      className="min-h-11 flex-row items-center justify-between rounded-lg px-3 py-2.5 active:bg-accent"
      onPress={onSelect}
    >
      <Text className="text-sm font-medium text-foreground">{value}</Text>
      {active ? (
        <ThemedIonicon name="checkmark" size={18} color="archive-accent-text" />
      ) : null}
    </Pressable>
  );
}

export function FilterTrigger({
  activeFilter,
  onPress,
  compact = false,
  mobile = false,
}: {
  activeFilter: string;
  onPress: () => void;
  compact?: boolean;
  mobile?: boolean;
}) {
  const filterActive = activeFilter !== ALL_CARDS_FILTER;

  if (compact) {
    return (
      <CatalogToolbarButton
        icon="options-outline"
        onPress={onPress}
        accessibilityLabel="Open filters"
        active={filterActive}
        mobile={mobile}
        badge={filterActive ? <CatalogToolbarBadgeDot /> : null}
      />
    );
  }

  return (
    <CatalogToolbarButton
      icon="options-outline"
      onPress={onPress}
      accessibilityLabel="Open filters"
      active={filterActive}
      mobile={mobile}
      label="Filters"
      badge={
        filterActive ? (
          <View className="size-5 items-center justify-center rounded-full bg-primary">
            <Text className="font-mono text-[11px] font-semibold text-primary-foreground">1</Text>
          </View>
        ) : null
      }
    />
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
