import type { ReactNode } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Popover,
  PopoverContent,
  PopoverOverlay,
  PopoverPortal,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { cn } from '@/lib/utils';

export function FilterToggleRow({
  label,
  subtitle,
  active,
  onPress,
  leading,
  compact = false,
}: {
  label: string;
  subtitle?: string;
  active: boolean;
  onPress: () => void;
  leading?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Pressable
      className={cn(
        'flex-row items-center justify-between active:opacity-90',
        compact ? 'min-h-10 rounded-md px-2 py-2' : 'min-h-12 rounded-lg px-3 py-2.5',
        active ? 'bg-foreground/8' : 'bg-transparent'
      )}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
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

export function FilterStatChip({
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

export function FilterSegmentPill({
  label,
  active,
  hasValue,
  onPress,
  open,
}: {
  label: string;
  active?: boolean;
  hasValue?: boolean;
  onPress?: () => void;
  open?: boolean;
}) {
  return (
    <Pressable
      className={cn(
        'relative h-9 shrink-0 flex-row items-center gap-1 rounded-lg border px-2.5 active:opacity-90',
        active || hasValue
          ? 'border-ring/50 bg-card-panel'
          : 'border-border bg-card'
      )}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <Text
        className={cn(
          'text-[13px] font-semibold',
          active || hasValue ? 'text-foreground' : 'text-muted-foreground'
        )}
        numberOfLines={1}
      >
        {label}
      </Text>
      <ThemedIonicon
        name={open ? 'chevron-up' : 'chevron-down'}
        size={14}
        color={active || hasValue ? 'foreground' : 'muted-foreground'}
      />
      {hasValue && !active ? (
        <View className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
      ) : null}
    </Pressable>
  );
}

export function FilterCollectionSegment({
  value,
  onChange,
}: {
  value: 'all' | 'owned';
  onChange: (value: 'all' | 'owned') => void;
}) {
  const options: { id: 'all' | 'owned'; label: string }[] = [
    { id: 'all', label: 'All cards' },
    { id: 'owned', label: 'Owned' },
  ];

  return (
    <View className="w-full flex-row items-center rounded-lg border border-border bg-card p-0.5">
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={cn(
              'h-9 min-w-0 flex-1 items-center justify-center rounded-md active:opacity-90',
              selected ? 'bg-card-panel' : 'bg-transparent'
            )}
            onPress={() => onChange(option.id)}
          >
            <Text
              className={cn(
                'text-[13px] font-semibold',
                selected ? 'text-foreground' : 'text-muted-foreground'
              )}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface FilterPopoverSectionProps {
  label: string;
  hasValue: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  portalName: string;
  contentClassName?: string;
  maxHeight?: number;
}

export function FilterPopoverSection({
  label,
  hasValue,
  open,
  onOpenChange,
  children,
  portalName,
  contentClassName,
  maxHeight = 420,
}: FilterPopoverSectionProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const viewportMaxHeight = Math.max(
    160,
    windowHeight - insets.top - insets.bottom - 96
  );
  const effectiveMaxHeight = Math.min(maxHeight, viewportMaxHeight);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        className={cn(
          'relative h-9 shrink-0 flex-row items-center gap-1 rounded-lg border px-2.5 active:opacity-90',
          open || hasValue ? 'border-ring/50 bg-card-panel' : 'border-border bg-card'
        )}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text
          className={cn(
            'text-[13px] font-semibold',
            open || hasValue ? 'text-foreground' : 'text-muted-foreground'
          )}
          numberOfLines={1}
        >
          {label}
        </Text>
        <ThemedIonicon
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={open || hasValue ? 'foreground' : 'muted-foreground'}
        />
        {hasValue && !open ? (
          <View className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
        ) : null}
      </PopoverTrigger>
      <PopoverPortal name={portalName}>
        <PopoverOverlay />
        <PopoverContent
          className={cn('border border-border bg-card-panel p-0 shadow-md', contentClassName)}
          side="bottom"
          align="start"
          width={280}
        >
          <ScrollView
            style={{ maxHeight: effectiveMaxHeight }}
            contentContainerClassName="p-2"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {children}
          </ScrollView>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}

export function FilterClearButton({ onPress, label = 'Clear all' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable
      className="h-9 shrink-0 items-center justify-center rounded-lg px-2 active:opacity-80"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text className="text-[13px] font-semibold text-primary">{label}</Text>
    </Pressable>
  );
}
