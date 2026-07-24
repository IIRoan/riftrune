import {
  BookmarkIcon,
  CardsThreeIcon,
  LayersIcon,
  LayoutGridIcon,
  LogOutIcon,
  type LucideIcon,
} from '@/components/icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { authClient } from '@/src/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { removeUserDataQueries } from '@/src/api/queryClient';
import { clearPersistedCollection } from '@/services/collectionCacheService';
import { clearPersistedCatalogIndex } from '@/services/catalogIndexService';

type NavId = 'search' | 'collection' | 'wishlist' | 'decks' | 'settings';

const NAV_ITEMS: {
  id: NavId;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: 'search',
    href: '/(tabs)/search',
    label: 'Cards',
    description: 'Browse and search the card catalog',
    icon: LayoutGridIcon,
  },
  {
    id: 'collection',
    href: '/(tabs)/collection',
    label: 'Collection',
    description: 'View and update cards you own',
    icon: CardsThreeIcon,
  },
  {
    id: 'wishlist',
    href: '/(tabs)/wishlist',
    label: 'Wishlist',
    description: 'Track cards you want and price changes',
    icon: BookmarkIcon,
  },
  {
    id: 'decks',
    href: '/(tabs)/decks',
    label: 'Decks',
    description: 'Build decks and browse community lists',
    icon: LayersIcon,
  },
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
      <View className="h-full w-12 items-center gap-1 overflow-visible rounded-xl border border-border bg-card py-3 shadow-sm shadow-black/20">
        <HoverTooltip label="Home" description="Open the card catalog" side="right">
          <Pressable
            accessibilityLabel="riftrune home"
            className="mb-2 size-8 items-center justify-center rounded-md bg-primary"
            onPress={() => {
              router.push('/(tabs)/search');
            }}
          >
            <Text className="font-mono text-sm font-bold text-primary-foreground">
              r
            </Text>
          </Pressable>
        </HoverTooltip>

        <View className="h-px w-6 bg-border" />

        <View className="mt-1 gap-0.5" accessibilityRole="tablist">
          {NAV_ITEMS.map(({ id, href, label, description, icon: Icon }) => {
            const isActive = active === id;
            return (
              <HoverTooltip
                key={id}
                label={label}
                description={description}
                side="right"
              >
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${label}. ${description}`}
                  onPress={() => {
                    router.push(href as '/(tabs)/search');
                  }}
                  className={cn(
                    'size-9 items-center justify-center rounded-md',
                    isActive ? 'bg-accent' : 'active:bg-accent/70'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4',
                      isActive ? 'text-accent-foreground' : 'text-muted-foreground'
                    )}
                  />
                </Pressable>
              </HoverTooltip>
            );
          })}
        </View>

        <View className="flex-1" />

        <View className="gap-0.5">
          <HoverTooltip
            label="Settings"
            description="Account, appearance, and app preferences"
            side="right"
          >
            <Pressable
              accessibilityLabel={`Account: ${userName}. Open settings`}
              className={cn(
                'size-9 items-center justify-center rounded-md',
                active === 'settings' ? 'bg-accent' : 'active:bg-accent/70'
              )}
              onPress={() => {
                router.push('/(tabs)/settings');
              }}
            >
              <Text
                className={cn(
                  'font-mono text-xs font-semibold',
                  active === 'settings'
                    ? 'text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {userInitial}
              </Text>
            </Pressable>
          </HoverTooltip>
          <HoverTooltip
            label="Sign out"
            description="End your Riftrune session"
            side="right"
          >
            <Pressable
              accessibilityLabel="Sign out"
              className="size-9 items-center justify-center rounded-md active:bg-accent/70"
              onPress={() => {
                void handleSignOut();
              }}
            >
              <LogOutIcon className="size-4 text-muted-foreground" />
            </Pressable>
          </HoverTooltip>
        </View>
      </View>
    </View>
  );
}
