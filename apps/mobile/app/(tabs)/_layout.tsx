import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import { Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { AppShell } from '@/components/shell/AppShell';
import { AuthGate } from '@/components/auth/AuthGate';
import { useShowSideRail } from '@/hooks/useBreakpoint';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const showRail = useShowSideRail();
  const { width } = Dimensions.get('window');
  const tabBarWidth = Math.min(width - 32, 400);
  const tabCount = 4;
  const tabWidth = tabBarWidth / tabCount;

  const [primaryRaw, cardRaw, borderRaw, mutedForegroundRaw, backgroundRaw] = useCSSVariable([
    '--color-primary',
    '--color-card',
    '--color-border',
    '--color-muted-foreground',
    '--color-background',
  ]);
  const primary = String(primaryRaw ?? 'oklch(0.976 0.063 111)');
  const card = String(cardRaw ?? 'oklch(0.175 0 0)');
  const border = String(borderRaw ?? 'oklch(0.292 0 0)');
  const mutedForeground = String(mutedForegroundRaw ?? 'oklch(0.720 0 0)');
  const background = String(backgroundRaw ?? 'oklch(0.130 0 0)');

  const showTabBar = !pathname.startsWith('/card/') && !showRail;

  return (
    <AuthGate>
      <AppShell>
        <View className="flex-1 bg-background">
          <Tabs
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: primary,
            tabBarInactiveTintColor: mutedForeground,
            tabBarStyle: {
              position: 'absolute',
              bottom: insets.bottom + 12,
              marginHorizontal: (width - tabBarWidth) / 2,
              backgroundColor: card,
              borderRadius: 16,
              height: 56,
              width: tabBarWidth,
              paddingBottom: 4,
              paddingTop: 4,
              display: showTabBar ? 'flex' : 'none',
              borderTopWidth: 0,
              borderWidth: 1,
              borderColor: border,
              elevation: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
            },
            tabBarItemStyle: { height: 48, width: tabWidth },
            tabBarLabelStyle: { fontWeight: '600', fontSize: 10, marginTop: 2 },
            tabBarIcon: ({ focused, color, size }) => {
              const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
                index: focused ? 'home' : 'home-outline',
                search: focused ? 'grid' : 'grid-outline',
                collection: focused ? 'archive' : 'archive-outline',
                decks: focused ? 'layers' : 'layers-outline',
                settings: focused ? 'settings' : 'settings-outline',
              };
              const name = iconMap[route.name] ?? 'help-outline';
              return (
                <View className="items-center justify-center">
                  <Ionicons name={name} size={size - 2} color={color} />
                </View>
              );
            },
            sceneStyle: { backgroundColor: background, flex: 1 },
          })}
        >
          <Tabs.Screen name="index" options={{ href: null }} />
          <Tabs.Screen name="search" options={{ title: 'Cards' }} />
          <Tabs.Screen name="collection" options={{ title: 'Collection' }} />
          <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', href: null }} />
          <Tabs.Screen name="decks" options={{ title: 'Decks' }} />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              ...(showRail ? { href: null } : {}),
            }}
          />
        </Tabs>
        </View>
      </AppShell>
    </AuthGate>
  );
}
