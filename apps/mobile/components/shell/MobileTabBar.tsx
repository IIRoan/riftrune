import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { Layout } from '@/constants/Layout';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

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
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { routeName: 'search', label: 'Cards', icon: 'grid-outline', iconActive: 'grid' },
  {
    routeName: 'collection',
    label: 'Collection',
    icon: 'archive-outline',
    iconActive: 'archive',
  },
  {
    routeName: 'wishlist',
    label: 'Wishlist',
    icon: 'bookmark-outline',
    iconActive: 'bookmark',
  },
  {
    routeName: 'decks',
    label: 'Decks',
    icon: 'layers-outline',
    iconActive: 'layers',
  },
  {
    routeName: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    iconActive: 'settings',
  },
];

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

  return (
    <View
      className="absolute left-0 right-0 items-center"
      style={{ bottom: bottomOffset }}
      pointerEvents="box-none"
    >
      <View
        accessibilityRole="tablist"
        className="flex-row items-stretch rounded-2xl border border-border bg-card"
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
        {TAB_ITEMS.map((item) => {
          const routeIndex = state.routes.findIndex((route) => route.name === item.routeName);
          if (routeIndex === -1) return null;

          const route = state.routes[routeIndex];
          const isFocused =
            state.index === routeIndex ||
            (item.routeName === 'decks' && pathname.startsWith('/decks'));
          const { options } = descriptors[route.key];
          const label = options.title ?? item.label;

          const onPress = () => {
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

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              className="min-h-11 flex-1 items-center justify-center gap-0.5 active:opacity-80"
            >
              <Ionicons name={isFocused ? item.iconActive : item.icon} size={22} color={color} />
              <Text
                className={cn(
                  'text-[10px] font-semibold',
                  isFocused ? 'text-primary' : 'text-muted-foreground'
                )}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
