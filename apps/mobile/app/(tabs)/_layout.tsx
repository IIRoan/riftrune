import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import { Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { width } = Dimensions.get('window');
  const tabBarWidth = width * 0.9;
  const tabWidth = tabBarWidth / 5;

  const [primaryRaw, cardRaw, borderRaw, mutedForegroundRaw] = useCSSVariable([
    '--color-primary',
    '--color-card',
    '--color-border',
    '--color-muted-foreground',
  ]);
  const primary = String(primaryRaw ?? '#c89b3c');
  const card = String(cardRaw ?? '#1c1b1a');
  const border = String(borderRaw ?? '#252422');
  const mutedForeground = String(mutedForegroundRaw ?? '#6b6866');

  const showTabBar = !pathname.startsWith('/card/');

  return (
    <View className="flex-1 bg-background">
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: primary,
          tabBarInactiveTintColor: mutedForeground,
          tabBarStyle: {
            position: 'absolute',
            bottom: insets.bottom + 15,
            marginHorizontal: (width - tabBarWidth) / 2,
            backgroundColor: card,
            borderRadius: 35,
            height: 60,
            width: tabBarWidth,
            paddingBottom: 5,
            paddingTop: 5,
            display: showTabBar ? 'flex' : 'none',
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: border,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
          },
          tabBarItemStyle: { height: 50, width: tabWidth },
          tabBarLabelStyle: { fontWeight: '600', fontSize: 10, marginTop: 4 },
          tabBarIcon: ({ focused, color, size }) => {
            const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
              index: focused ? 'home' : 'home-outline',
              search: focused ? 'search' : 'search-outline',
              collection: focused ? 'albums' : 'albums-outline',
              decks: focused ? 'layers' : 'layers-outline',
              settings: focused ? 'settings' : 'settings-outline',
            };
            const name = iconMap[route.name] ?? 'help-outline';
            return (
              <View className="items-center justify-center">
                <Ionicons name={name} size={size} color={color} />
                {focused ? (
                  <View className="absolute -bottom-1.5 size-1 rounded-full bg-primary" />
                ) : null}
              </View>
            );
          },
        })}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="collection" options={{ title: 'Collection' }} />
        <Tabs.Screen name="decks" options={{ title: 'Decks' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </View>
  );
}
