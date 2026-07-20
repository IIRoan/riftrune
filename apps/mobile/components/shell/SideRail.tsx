import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { authClient } from '@/src/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { removeUserDataQueries } from '@/src/api/queryClient';
import { clearPersistedCollection } from '@/services/collectionCacheService';
import { clearPersistedCatalogIndex } from '@/services/catalogIndexService';

type NavId = 'search' | 'collection' | 'wishlist' | 'decks' | 'settings';

const NAV_ITEMS: { id: NavId; href: string; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'search', href: '/(tabs)/search', label: 'Cards', icon: 'grid-outline', iconActive: 'grid' },
  { id: 'collection', href: '/(tabs)/collection', label: 'Collection', icon: 'archive-outline', iconActive: 'archive' },
  { id: 'wishlist', href: '/(tabs)/wishlist', label: 'Wishlist', icon: 'bookmark-outline', iconActive: 'bookmark' },
  { id: 'decks', href: '/(tabs)/decks', label: 'Decks', icon: 'layers-outline', iconActive: 'layers' },
];

function routeToNav(pathname: string): NavId {
  if (pathname.includes('/collection')) return 'collection';
  if (pathname.includes('/wishlist')) return 'wishlist';
  if (pathname.includes('/decks')) return 'decks';
  if (pathname.includes('/settings')) return 'settings';
  return 'search';
}

export function SideRail() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const active = routeToNav(pathname);
  const sessionQuery = authClient.useSession();
  const { data: session } = sessionQuery;
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await authClient.signOut();
    await sessionQuery.refetch();
    await clearPersistedCollection();
    await clearPersistedCatalogIndex();
    removeUserDataQueries(queryClient);
  };

  const userName = session?.user?.name ?? '';
  const userInitial = userName.charAt(0).toUpperCase() || '?';

  return (
    <View
      className="shrink-0 self-stretch items-end py-3 pl-2 pr-0"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="h-full w-12 items-center gap-1 overflow-hidden rounded-xl border border-border bg-card py-3 shadow-lg shadow-black/50">
        <Pressable
          accessibilityLabel="riftrune home"
          className="mb-2 size-8 items-center justify-center rounded-lg bg-primary"
          onPress={() => {
            router.push('/(tabs)/search');
          }}
        >
          <Text className="font-mono text-sm font-bold text-primary-foreground">r</Text>
        </Pressable>

        <View className="h-px w-6 bg-archive-soft-line" />

        <View className="mt-1 gap-1" accessibilityRole="tablist">
          {NAV_ITEMS.map(({ id, href, label, icon, iconActive }) => {
            const isActive = active === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={label}
                onPress={() => {
                  router.push(href as '/(tabs)/search');
                }}
                className={cn(
                  'size-9 items-center justify-center rounded-lg',
                  isActive ? 'bg-card-panel' : 'active:bg-card-panel/60'
                )}
              >
                <Ionicons
                  name={isActive ? iconActive : icon}
                  size={18}
                  className={isActive ? 'text-foreground' : 'text-muted-foreground'}
                />
              </Pressable>
            );
          })}
        </View>

        <View className="flex-1" />

        <View className="gap-1">
          <Pressable
            accessibilityLabel="Add card"
            className="size-9 items-center justify-center rounded-lg bg-primary active:opacity-90"
            onPress={() => {
              router.push('/(tabs)/search');
            }}
          >
            <Ionicons name="add" size={18} className="text-primary-foreground" />
          </Pressable>
          <Pressable
            accessibilityLabel={`Account: ${userName}`}
            className="size-9 items-center justify-center rounded-lg bg-card-panel active:opacity-80"
            onPress={() => {
              router.push('/(tabs)/settings');
            }}
          >
            <Text className="font-mono text-sm font-bold text-foreground">{userInitial}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Sign out"
            className="size-9 items-center justify-center rounded-lg active:bg-card-panel"
            onPress={() => {
              void handleSignOut();
            }}
          >
            <Ionicons name="log-out-outline" size={18} className="text-muted-foreground" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
