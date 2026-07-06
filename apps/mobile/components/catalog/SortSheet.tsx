import { Pressable } from 'react-native';
import { CatalogToolbarButton } from '@/components/catalog/CatalogToolbarButton';
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
import {
  CATALOG_SORT_OPTIONS,
  sortOptionKey,
  type CatalogSort,
} from '@/constants/catalogSort';
import { useReduceMotion } from '@/hooks/useReduceMotion';

interface SortSheetProps {
  visible: boolean;
  activeSort: CatalogSort;
  onClose: () => void;
  onSortChange: (sort: CatalogSort) => void;
}

export function SortSheet({ visible, activeSort, onClose, onSortChange }: SortSheetProps) {
  const reduceMotion = useReduceMotion();
  const snapPoints = reduceMotion ? ['92%'] : ['50%', '92%'];

  return (
    <BottomSheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheetPortal name="catalog-sort-sheet">
        <BottomSheetOverlay />
        <BottomSheetContent
          snapPoints={snapPoints}
          defaultSnapIndex={0}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
        >
          <BottomSheetHeader>
            <BottomSheetTitle>Sort</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetScrollView
            contentContainerClassName="px-4 pb-6"
            showsVerticalScrollIndicator={false}
          >
            {CATALOG_SORT_OPTIONS.map((option) => {
              const active = sortOptionKey(activeSort) === sortOptionKey(option);
              return (
                <Pressable
                  key={sortOptionKey(option)}
                  className="min-h-11 flex-row items-center justify-between rounded-lg px-3 py-2.5 active:bg-accent"
                  onPress={() => {
                    onSortChange({ sortBy: option.sortBy, dir: option.dir });
                    onClose();
                  }}
                >
                  <Text className="text-sm font-medium text-foreground">{option.label}</Text>
                  {active ? (
                    <ThemedIonicon name="checkmark" size={18} color="archive-accent-text" />
                  ) : null}
                </Pressable>
              );
            })}
          </BottomSheetScrollView>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}

export function SortTrigger({
  label,
  onPress,
  compact = false,
  mobile = false,
}: {
  label?: string;
  onPress: () => void;
  compact?: boolean;
  mobile?: boolean;
}) {
  return (
    <CatalogToolbarButton
      icon="swap-vertical-outline"
      onPress={onPress}
      accessibilityLabel="Open sort options"
      label={compact ? undefined : (label ?? 'Sort')}
      mobile={mobile}
    />
  );
}
