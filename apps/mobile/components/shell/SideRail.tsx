import {
  BookmarkIcon,
  CardsThreeIcon,
  CompassIcon,
  LayersIcon,
  LayoutGridIcon,
  LogOutIcon,
  type LucideIcon,
} from '@/components/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { Text } from '@/components/ui/text';
import { FACTORY_RADIUS_CONTROL_CLASS } from '@/constants/factoryShape';
import { cn } from '@/lib/utils';
import { authClient } from '@/src/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { removeUserDataQueries } from '@/src/api/queryClient';
import { clearPersistedQueryClient } from '@/src/api/queryPersist';
import { clearPersistedCollection } from '@/services/collectionCacheService';
import { clearPersistedOwnedDecks } from '@/services/deckCacheService';
import { clearPersistedWishlist } from '@/services/wishlistCacheService';
import { clearPersistedCatalogIndex } from '@/services/catalogIndexService';
import { clearLastCachedUserId } from '@/services/userCacheScope';
import { hapticPress } from '@/utils/haptics';
import { usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavId = 'search' | 'collection' | 'wishlist' | 'decks' | 'play' | 'settings';

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
  {
    id: 'play',
    href: '/(tabs)/play',
    label: 'Play',
    description: 'Table scoreboard for victory points and XP',
    icon: CompassIcon,
  },
];

function routeToNav(pathname: string): NavId {
  if (pathname.includes('/collection')) return 'collection';
  if (pathname.includes('/wishlist')) return 'wishlist';
  if (pathname.includes('/decks')) return 'decks';
  if (pathname.includes('/play')) return 'play';
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
    await clearPersistedOwnedDecks();
    await clearPersistedWishlist();
    await clearPersistedCatalogIndex();
    await clearPersistedQueryClient();
    await clearLastCachedUserId();
    removeUserDataQueries(queryClient);
  };

  const userName = session?.user?.name ?? '';
  const userInitial = userName.charAt(0).toUpperCase() || '?';

  return (
    <View
      className="shrink-0 self-stretch items-end py-3 pl-4 pr-0"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View
        className={cn(
          'h-full w-12 items-center gap-1 overflow-visible border border-border bg-card py-3',
          FACTORY_RADIUS_CONTROL_CLASS
        )}
      >
        <HoverTooltip label="Home" description="Open the card catalog" side="right">
          <PressableScale
            accessibilityLabel="riftrune home"
            className={cn(
              'mb-2 size-8 items-center justify-center bg-foreground',
              FACTORY_RADIUS_CONTROL_CLASS
            )}
            contentClassName="items-center justify-center"
            onPress={() => {
              void hapticPress();
              router.push('/(tabs)/search');
            }}
          >
            <Text className="font-mono text-sm font-medium text-background">
              r
            </Text>
          </PressableScale>
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
                <PressableScale
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${label}. ${description}`}
                  onPress={() => {
                    void hapticPress();
                    router.push(href as '/(tabs)/search');
                  }}
                  className={cn(
                    'size-9 items-center justify-center',
                    FACTORY_RADIUS_CONTROL_CLASS,
                    isActive && 'bg-accent'
                  )}
                  contentClassName="items-center justify-center"
                  depth={0.92}
                >
                  <Icon
                    className={cn(
                      'size-4',
                      isActive ? 'text-accent-foreground' : 'text-muted-foreground'
                    )}
                  />
                </PressableScale>
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
            <PressableScale
              accessibilityLabel={`Account: ${userName}. Open settings`}
              className={cn(
                'size-9 items-center justify-center',
                FACTORY_RADIUS_CONTROL_CLASS,
                active === 'settings' && 'bg-accent'
              )}
              contentClassName="items-center justify-center"
              onPress={() => {
                void hapticPress();
                router.push('/(tabs)/settings');
              }}
            >
              <Text
                className={cn(
                  'font-mono text-xs font-normal',
                  active === 'settings'
                    ? 'text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {userInitial}
              </Text>
            </PressableScale>
          </HoverTooltip>
          <HoverTooltip
            label="Sign out"
            description="End your Riftrune session"
            side="right"
          >
            <PressableScale
              accessibilityLabel="Sign out"
              className={cn(
                'size-9 items-center justify-center',
                FACTORY_RADIUS_CONTROL_CLASS
              )}
              contentClassName="items-center justify-center"
              onPress={() => {
                void hapticPress();
                void handleSignOut();
              }}
            >
              <LogOutIcon className="size-4 text-muted-foreground" />
            </PressableScale>
          </HoverTooltip>
        </View>
      </View>
    </View>
  );
}
