import { ChevronDownIcon, ChevronUpIcon, CircleCheckIcon, ThemedIcon } from '@/components/icons';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Popover,
  PopoverContent,
  PopoverPortal,
} from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
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
        <ThemedIcon icon={CircleCheckIcon} size={20} color="archive-accent-text" />
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
        'relative h-9 shrink-0 flex-row items-center gap-1.5 rounded-lg border px-3 active:opacity-90',
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
          'text-[13px] font-semibold leading-none',
          active || hasValue ? 'text-foreground' : 'text-muted-foreground'
        )}
        numberOfLines={1}
      >
        {label}
      </Text>
      <ThemedIcon
        icon={open ? ChevronUpIcon : ChevronDownIcon}
        size={12}
        color={active || hasValue ? 'foreground' : 'muted-foreground'}
      />
      {hasValue && !active ? (
        <View className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
      ) : null}
    </Pressable>
  );
}

type TriggerPosition = {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
};

export type FilterPopoverBarItem<T extends string> = {
  id: T;
  label: string;
  hasValue: boolean;
  children: ReactNode;
  contentClassName?: string;
  maxHeight?: number;
};

export function FilterPopoverTrigger({
  label,
  hasValue,
  open,
  onPress,
  triggerRef,
}: {
  label: string;
  hasValue: boolean;
  open: boolean;
  onPress: () => void;
  triggerRef: (node: View | null) => void;
}) {
  return (
    <Pressable
      ref={triggerRef}
      className={cn(
        'relative h-9 shrink-0 flex-row items-center gap-1.5 rounded-lg border px-3 active:opacity-90',
        open || hasValue ? 'border-ring/50 bg-card-panel' : 'border-border bg-card'
      )}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <Text
        className={cn(
          'text-[13px] font-semibold leading-none',
          open || hasValue ? 'text-foreground' : 'text-muted-foreground'
        )}
        numberOfLines={1}
      >
        {label}
      </Text>
      <ThemedIcon
        icon={open ? ChevronUpIcon : ChevronDownIcon}
        size={12}
        color={open || hasValue ? 'foreground' : 'muted-foreground'}
      />
      {hasValue && !open ? (
        <View className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
      ) : null}
    </Pressable>
  );
}

/** One shared popover for a filter bar so sibling triggers stay clickable while switching menus. */
export function FilterPopoverBar<T extends string>({
  portalName,
  openId,
  onOpenIdChange,
  segments,
}: {
  portalName: string;
  openId: T | null;
  onOpenIdChange: (id: T | null) => void;
  segments: FilterPopoverBarItem<T>[];
}) {
  const triggerRefs = useRef<Partial<Record<T, View | null>>>({});
  const contentRef = useRef<ScrollViewType | null>(null);
  const [triggerPosition, setTriggerPosition] = useState<TriggerPosition>();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const viewportMaxHeight = Math.max(160, windowHeight - insets.top - insets.bottom - 96);
  const activeSegment = segments.find((segment) => segment.id === openId);

  const handleTriggerPress = useCallback(
    (id: T) => {
      const node = triggerRefs.current[id];
      if (!node) return;

      node.measure((_x, _y, width, height, pageX, pageY) => {
        setTriggerPosition({ pageX, pageY, width, height });
        onOpenIdChange(openId === id ? null : id);
      });
    },
    [onOpenIdChange, openId]
  );

  const effectiveMaxHeight = activeSegment
    ? Math.min(activeSegment.maxHeight ?? 420, viewportMaxHeight)
    : viewportMaxHeight;

  useEffect(() => {
    if (!openId || Platform.OS !== 'web') return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const clickedTrigger = Object.values(triggerRefs.current).some((node) => {
        const element = node as unknown as { contains?: (child: Node) => boolean } | null;
        return element?.contains?.(target) ?? false;
      });
      if (clickedTrigger) return;

      const contentNode = contentRef.current as unknown as {
        contains?: (child: Node) => boolean;
      } | null;
      if (contentNode?.contains?.(target)) return;

      onOpenIdChange(null);
      setTriggerPosition(undefined);
    };

    const frame = requestAnimationFrame(() => {
      document.addEventListener('pointerdown', handlePointerDown, true);
    });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [openId, onOpenIdChange]);

  return (
    <>
      {segments.map((segment) => (
        <FilterPopoverTrigger
          key={segment.id}
          label={segment.label}
          hasValue={segment.hasValue}
          open={openId === segment.id}
          onPress={() => handleTriggerPress(segment.id)}
          triggerRef={(node) => {
            triggerRefs.current[segment.id] = node;
          }}
        />
      ))}

      <Popover
        open={openId !== null}
        switchKey={openId}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onOpenIdChange(null);
            setTriggerPosition(undefined);
          }
        }}
        triggerPosition={triggerPosition}
        onTriggerPositionChange={setTriggerPosition}
      >
        <PopoverPortal name={portalName}>
          {activeSegment ? (
            <PopoverContent
              className={cn(
                'border border-border bg-card-panel p-0 shadow-md',
                activeSegment.contentClassName
              )}
              side="bottom"
              align="start"
              width={280}
            >
              <ScrollView
                ref={contentRef}
                style={{ maxHeight: effectiveMaxHeight }}
                contentContainerClassName="p-2"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                nestedScrollEnabled
              >
                {activeSegment.children}
              </ScrollView>
            </PopoverContent>
          ) : null}
        </PopoverPortal>
      </Popover>
    </>
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
