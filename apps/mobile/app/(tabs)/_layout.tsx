import { usePathname } from 'expo-router';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { AppShell } from '@/components/shell/AppShell';
import { MobileTabBar, type MobileTabBarProps } from '@/components/shell/MobileTabBar';
import { AuthGate } from '@/components/auth/AuthGate';
import { useShowSideRail } from '@/hooks/useBreakpoint';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  const pathname = usePathname();
  const showRail = useShowSideRail();
  const showTabBar = !pathname.startsWith('/card/') && !showRail;
  const [backgroundRaw] = useCSSVariable(['--color-background']);
  const background = String(backgroundRaw ?? 'oklch(0.130 0 0)');

  return (
    <AuthGate>
      <AppShell>
        <View className="flex-1 bg-background">
          <Tabs
            tabBar={
              showTabBar
                ? (props) => <MobileTabBar {...(props as unknown as MobileTabBarProps)} />
                : () => null
            }
            screenOptions={{
              headerShown: false,
              sceneStyle: { backgroundColor: background, flex: 1 },
            }}
          >
            <Tabs.Screen name="index" options={{ href: null }} />
            <Tabs.Screen name="search" options={{ title: 'Cards' }} />
            <Tabs.Screen name="collection" options={{ title: 'Collection' }} />
            <Tabs.Screen name="wishlist" options={{ title: 'Wishlist' }} />
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
