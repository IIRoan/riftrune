import { usePathname, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

const NAV_ITEMS = [
  { href: '/(tabs)/decks' as const, label: 'My decks' },
  { href: '/(tabs)/decks/browse' as const, label: 'Browse decks' },
] as const;

function isBrowseDecksPath(pathname: string): boolean {
  return pathname.includes('/decks/browse');
}

export function DecksSubNav() {
  const router = useRouter();
  const pathname = usePathname();
  const browseActive = isBrowseDecksPath(pathname);

  return (
    <View
      accessibilityRole="tablist"
      className="mb-4 flex-row rounded-xl border border-border bg-card p-1"
    >
      {NAV_ITEMS.map(({ href, label }) => {
        const active = href.endsWith('/browse') ? browseActive : !browseActive;
        return (
          <Pressable
            key={href}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={cn(
              'min-w-0 flex-1 items-center rounded-lg px-3 py-2.5',
              active ? 'bg-card-panel' : 'active:bg-card-panel/60'
            )}
            onPress={() => {
              hapticPress();
              router.push(href);
            }}
          >
            <Text
              className={cn(
                'text-center text-sm font-semibold',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
