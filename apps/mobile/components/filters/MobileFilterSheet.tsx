import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import {
  Accordion,
  AccordionContent,
  AccordionIndicator,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { cn } from '@/lib/utils';

interface MobileFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  activeCount: number;
  hasActiveFilters: boolean;
  onClear: () => void;
  doneLabel?: string;
  portalName: string;
  stickyHeader?: ReactNode;
  children: ReactNode;
}

export function MobileFilterSheet({
  visible,
  onClose,
  title = 'Filters',
  activeCount,
  hasActiveFilters,
  onClear,
  doneLabel = 'Done',
  portalName,
  stickyHeader,
  children,
}: MobileFilterSheetProps) {
  const reduceMotion = useReduceMotion();
  const snapPoints = reduceMotion ? ['94%'] : ['94%'];

  return (
    <BottomSheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheetPortal name={portalName}>
        <BottomSheetOverlay />
        <BottomSheetContent
          snapPoints={snapPoints}
          defaultSnapIndex={0}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
          className="bg-card-panel"
        >
          <BottomSheetHeader className="border-b border-border bg-card-panel">
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                  <BottomSheetTitle>{title}</BottomSheetTitle>
                  {hasActiveFilters ? (
                    <View className="h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5">
                      <Text className="font-mono text-[11px] font-semibold text-primary-foreground">
                        {activeCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {hasActiveFilters ? (
                  <Pressable
                    onPress={onClear}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all filters"
                    className="shrink-0 active:opacity-70"
                  >
                    <Text className="text-sm font-semibold text-primary">Clear all</Text>
                  </Pressable>
                ) : null}
              </View>
              {stickyHeader ? <View>{stickyHeader}</View> : null}
            </View>
          </BottomSheetHeader>

          <BottomSheetScrollView
            contentContainerClassName="px-4 pb-6 pt-2"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </BottomSheetScrollView>

          <BottomSheetFooter className="border-border border-t bg-card-panel pt-3">
            <Button className="w-full" onPress={onClose}>
              <ButtonText>{doneLabel}</ButtonText>
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}

interface FilterAccordionSectionProps {
  value: string;
  label: string;
  summary?: string;
  active: boolean;
  children: ReactNode;
}

export function FilterAccordionSection({
  value,
  label,
  summary,
  active,
  children,
}: FilterAccordionSectionProps) {
  return (
    <AccordionItem value={value} className="bg-transparent">
      <AccordionTrigger className="rounded-xl bg-card px-3 py-3">
        <View className="min-w-0 flex-1 pr-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-foreground">{label}</Text>
            {active ? <View className="size-1.5 rounded-full bg-primary" /> : null}
          </View>
          {summary ? (
            <Text className="mt-0.5 text-[12px] text-muted-foreground" numberOfLines={1}>
              {summary}
            </Text>
          ) : null}
        </View>
        <AccordionIndicator />
      </AccordionTrigger>
      <AccordionContent className="px-1 pt-2 pb-1">{children}</AccordionContent>
    </AccordionItem>
  );
}

interface FilterAccordionGroupProps {
  defaultOpen: string[];
  children: ReactNode;
}

export function FilterAccordionGroup({ defaultOpen, children }: FilterAccordionGroupProps) {
  return (
    <View className="gap-2">
      <Accordion type="multiple" defaultValue={defaultOpen} collapsible>
        {children}
      </Accordion>
    </View>
  );
}

export function FilterOptionChip({
  label,
  active,
  onPress,
  leading,
  accessibilityLabel,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  leading?: ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      className={cn(
        'min-h-10 flex-row items-center gap-1.5 rounded-lg border px-3 py-2 active:opacity-90',
        active ? 'border-ring bg-card-panel' : 'border-border bg-card'
      )}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {leading}
      <Text
        className={cn(
          'text-sm font-semibold',
          active ? 'text-foreground' : 'text-muted-foreground'
        )}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function FilterChipGrid({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap gap-2">{children}</View>;
}
