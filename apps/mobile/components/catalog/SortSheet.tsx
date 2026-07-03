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
import { Ionicons } from '@expo/vector-icons';
import {
  CATALOG_SORT_OPTIONS,
  sortOptionKey,
  type CatalogSort,
} from '@/constants/catalogSort';

interface SortSheetProps {
  visible: boolean;
  activeSort: CatalogSort;
  onClose: () => void;
  onSortChange: (sort: CatalogSort) => void;
}

export function SortSheet({ visible, activeSort, onClose, onSortChange }: SortSheetProps) {
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
            <BottomSheetTitle>Sort</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetBody>
            <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
              {CATALOG_SORT_OPTIONS.map((option) => {
                const active = sortOptionKey(activeSort) === sortOptionKey(option);
                return (
                  <Pressable
                    key={sortOptionKey(option)}
                    className="flex-row items-center justify-between rounded-lg px-2.5 py-2.5 active:bg-accent"
                    onPress={() => {
                      onSortChange({ sortBy: option.sortBy, dir: option.dir });
                      onClose();
                    }}
                  >
                    <Text className="text-sm font-medium text-foreground">{option.label}</Text>
                    {active ? (
                      <Ionicons name="checkmark" size={18} className="text-archive-accent-text" />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}

export function SortTrigger({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="h-9 items-center justify-center rounded-lg border border-border px-3 active:opacity-80"
      onPress={onPress}
      accessibilityLabel="Open sort options"
    >
      <Text className="text-sm font-medium text-foreground">{label}</Text>
    </Pressable>
  );
}
