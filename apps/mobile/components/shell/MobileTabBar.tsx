import {
  BookmarkIcon,
  CardsThreeIcon,
  CompassIcon,
  LayersIcon,
  LayoutGridIcon,
  SettingsIcon,
  type LucideIcon,
} from '@/components/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { Layout } from '@/constants/Layout';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';
import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

type TabRoute = {
  key: string;
  name: string;
  params?: object;
};

export type MobileTabBarProps = {
  state: {
    index: number;
    routes: TabRoute[];
  };
  descriptors: Record<
    string,
    {
      options: { title?: string };
    }
  >;
  navigation: {
    emit: (event: {
      type: 'tabPress' | 'tabLongPress';
      target: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

const TAB_ITEMS: {
  routeName: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { routeName: 'search', label: 'Cards', icon: LayoutGridIcon },
  { routeName: 'collection', label: 'Collection', icon: CardsThreeIcon },
  { routeName: 'wishlist', label: 'Wishlist', icon: BookmarkIcon },
  { routeName: 'decks', label: 'Decks', icon: LayersIcon },
  { routeName: 'play', label: 'Play', icon: CompassIcon },
  { routeName: 'settings', label: 'Settings', icon: SettingsIcon },
];

const INDICATOR_MS = 220;
const INDICATOR_EASE = Easing.out(Easing.cubic);

export function MobileTabBar({ state, descriptors, navigation }: MobileTabBarProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const tabBarWidth = Math.min(
    width - Layout.tabBarHorizontalInset * 2,
    Layout.tabBarMaxWidth
  );

  const [primaryRaw, cardRaw, borderRaw, mutedForegroundRaw] = useCSSVariable([
    '--color-primary',
    '--color-card',
    '--color-border',
    '--color-muted-foreground',
  ]);
  const primary = String(primaryRaw ?? 'oklch(0.976 0.063 111)');
  const card = String(cardRaw ?? 'oklch(0.175 0 0)');
  const border = String(borderRaw ?? 'oklch(0.292 0 0)');
  const mutedForeground = String(mutedForegroundRaw ?? 'oklch(0.720 0 0)');

  const bottomOffset = Math.max(insets.bottom, Layout.tabBarBottomMargin);

  const visibleItems = TAB_ITEMS.filter((item) =>
    state.routes.some((route) => route.name === item.routeName)
  );
  const activeVisibleIndex = Math.max(
    0,
    visibleItems.findIndex((item) => {
      const routeIndex = state.routes.findIndex((route) => route.name === item.routeName);
      return (
        state.index === routeIndex ||
        (item.routeName === 'decks' && pathname.startsWith('/decks'))
      );
    })
  );

  const indicatorX = useSharedValue(0);
  const segmentWidth = visibleItems.length > 0 ? tabBarWidth / visibleItems.length : 0;

  useEffect(() => {
    const nextX = segmentWidth * activeVisibleIndex;
    if (reduceMotion) {
      indicatorX.value = nextX;
      return;
    }
    indicatorX.value = withTiming(nextX, {
      duration: INDICATOR_MS,
      easing: INDICATOR_EASE,
    });
  }, [activeVisibleIndex, indicatorX, reduceMotion, segmentWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      className="absolute left-0 right-0 items-center"
      style={{ bottom: bottomOffset }}
      pointerEvents="box-none"
    >
      <View
        accessibilityRole="tablist"
        className="relative flex-row items-stretch overflow-hidden rounded-2xl border border-border bg-card"
        style={{
          width: tabBarWidth,
          height: Layout.tabBarHeight,
          marginHorizontal: (width - tabBarWidth) / 2,
          borderColor: border,
          backgroundColor: card,
          ...(reduceMotion
            ? {}
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 10,
              }),
        }}
      >
        {segmentWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            className="absolute bottom-1 top-1 rounded-xl bg-card-panel"
            style={indicatorStyle}
          />
        ) : null}
        {visibleItems.map((item) => {
          const routeIndex = state.routes.findIndex((route) => route.name === item.routeName);
          const route = state.routes[routeIndex]!;
          const isFocused =
            state.index === routeIndex ||
            (item.routeName === 'decks' && pathname.startsWith('/decks'));
          const { options } = descriptors[route.key]!;
          const label = options.title ?? item.label;

          const onPress = () => {
            void hapticPress();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const color = isFocused ? primary : mutedForeground;
          const Icon = item.icon;

          return (
            <PressableScale
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              className="min-h-11 flex-1 items-center justify-center"
              contentClassName="items-center justify-center gap-0.5"
              depth={0.94}
            >
              <Icon size={20} color={color} />
              <Text
                className={cn(
                  'text-[10px] font-semibold',
                  isFocused ? 'text-primary' : 'text-muted-foreground'
                )}
                numberOfLines={1}
              >
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
