import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { Layout } from '@/constants/Layout';
import { useShowSideRail } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

/** Extra scroll padding so list content clears the floating pill. */
export const FLOATING_PILL_NAV_CLEARANCE = 64;

type IoniconName = NonNullable<ComponentProps<typeof ThemedIonicon>['name']>;

export type PillNavItem<T extends string> = {
  id: T;
  label: string;
  accessibilityLabel?: string;
  icon: IoniconName;
  iconActive: IoniconName;
  /** Optional mono caption under the label (e.g. "12/40"). */
  badge?: string;
};

export type FloatingPillNavItem<T extends string> = PillNavItem<T>;

interface PillNavProps<T extends string> {
  items: readonly PillNavItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  /** Stretch segments to fill the container width. */
  fill?: boolean;
}

/**
 * Shared pill tablist (icon + small label) — same chrome for floating and inline use.
 */
export function PillNav<T extends string>({
  items,
  value,
  onChange,
  className,
  fill = false,
}: PillNavProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      className={cn(
        'flex-row items-stretch rounded-2xl border border-border bg-card p-1',
        fill && 'w-full',
        className
      )}
    >
      {items.map((item) => {
        const active = value === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.accessibilityLabel ?? item.label}
            className={cn(
              'items-center justify-center gap-0.5 rounded-xl px-4 py-2',
              fill ? 'min-w-0 flex-1' : 'min-w-[5.5rem]',
              active ? 'bg-card-panel' : 'active:bg-card-panel/50'
            )}
            onPress={() => {
              if (active) return;
              hapticPress();
              onChange(item.id);
            }}
          >
            <ThemedIonicon
              name={active ? item.iconActive : item.icon}
              size={18}
              color={active ? 'primary' : 'muted-foreground'}
            />
            <Text
              className={cn(
                'text-[10px] font-semibold',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {item.badge ? (
              <Text
                className={cn(
                  'font-mono text-[9px] font-semibold tabular-nums',
                  active ? 'text-primary/80' : 'text-muted-foreground'
                )}
                numberOfLines={1}
              >
                {item.badge}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

interface FloatingPillNavProps<T extends string> {
  items: readonly PillNavItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

/**
 * Floating bottom placement for PillNav — above the mobile tab bar,
 * or near the bottom edge on desktop side-rail layouts.
 */
export function FloatingPillNav<T extends string>({
  items,
  value,
  onChange,
  className,
}: FloatingPillNavProps<T>) {
  const insets = useSafeAreaInsets();
  const showRail = useShowSideRail();

  const bottom = showRail
    ? Math.max(insets.bottom, 12) + 10
    : Layout.tabBarHeight +
      Layout.tabBarBottomMargin +
      Math.max(insets.bottom, Layout.tabBarBottomMargin) +
      8;

  return (
    <View
      className={cn('absolute left-0 right-0 z-20 items-center', className)}
      style={{ bottom }}
      pointerEvents="box-none"
    >
      <PillNav items={items} value={value} onChange={onChange} />
    </View>
  );
}
