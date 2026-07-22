import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, View } from 'react-native';
import { TrendTag } from '@/components/catalog/TrendTag';
import {
  ScreenLayout,
  ScreenLayoutBody,
  useScreenLayout,
} from '@/components/shell/ScreenLayout';
import { Button, ButtonText } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { WishlistPriceHistoryPanel } from '@/components/wishlist/WishlistPriceHistoryPanel';
import {
  useWishlistPrices,
  type WishlistPriceItem,
} from '@/hooks/useWishlistPrices';
import { cn } from '@/lib/utils';
import { openCard } from '@/utils/cardNavigation';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { CARDMARKET_PRICE_DETAIL_NOTE } from '@riftbound/contracts';

type SortMode = 'move' | 'price' | 'name';

function formatPrice(value: number | null): string {
  return value == null ? '—' : `€${value.toFixed(2)}`;
}

function trendDelta(item: WishlistPriceItem): number {
  return item.changePercent ?? 0;
}

function matchesQuery(item: WishlistPriceItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.name.toLowerCase().includes(q) ||
    item.variantNumber.toLowerCase().includes(q) ||
    (item.priceFilterLabel?.toLowerCase().includes(q) ?? false)
  );
}

function sortItems(items: WishlistPriceItem[], mode: SortMode): WishlistPriceItem[] {
  const next = [...items];
  if (mode === 'name') {
    return next.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (mode === 'price') {
    return next.sort((a, b) => (b.currentPrice ?? -1) - (a.currentPrice ?? -1));
  }
  return next.sort((a, b) => Math.abs(trendDelta(b)) - Math.abs(trendDelta(a)));
}

function MiniSparkline({ points }: { points: WishlistPriceItem['points'] }) {
  if (points.length < 2) {
    return <View className="h-7 justify-center" />;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.01);

  return (
    <View className="h-7 flex-row items-end gap-px" accessibilityElementsHidden>
      {points.map((point, index) => {
        const pct = (point.value - min) / span;
        const height = 3 + pct * 22;
        const isLatest = index === points.length - 1;
        return (
          <View
            key={point.priceDate}
            className={cn(
              'min-w-0 flex-1 rounded-t-[1px]',
              isLatest ? 'bg-primary' : 'bg-muted-foreground/25'
            )}
            style={{ height }}
          />
        );
      })}
    </View>
  );
}

function WishlistRow({
  item,
  expanded,
  onToggle,
  onOpen,
}: {
  item: WishlistPriceItem;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <View className="border-b border-border">
      <Pressable
        onPress={onToggle}
        onLongPress={onOpen}
        className="min-h-14 flex-row items-center gap-3 py-3 active:opacity-90"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${item.name}, ${formatPrice(item.currentPrice)}, ${item.trend}`}
        accessibilityHint="Opens price details. Long press opens the card."
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: resolveImageUrl(item.imageUrl) }}
            className="h-14 w-10 rounded-md bg-card-panel"
            contentFit="cover"
            contentPosition="top"
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="h-14 w-10 items-center justify-center rounded-md bg-card-panel">
            <ThemedIonicon name="bookmark-outline" size={16} color="muted-foreground" />
          </View>
        )}

        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-medium text-foreground" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="mt-0.5 font-mono text-[11px] text-muted-foreground" numberOfLines={1}>
            {item.variantNumber}
            {item.belowTarget ? ' · at target' : ''}
          </Text>
        </View>

        <View className="w-[88px] shrink-0">
          <MiniSparkline points={item.points} />
        </View>

        <View className="min-w-[72px] items-end">
          <Text className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
            {formatPrice(item.currentPrice)}
          </Text>
          <TrendTag trend={item.trend} className="mt-0.5" />
        </View>

        <ThemedIonicon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="muted-foreground"
        />
      </Pressable>

      {expanded ? (
        <View className="gap-3 border-t border-border/60 bg-card-panel/40 pb-3.5 pt-3">
          <WishlistPriceHistoryPanel item={item} />
          <Button size="sm" variant="outline" className="self-start" onPress={onOpen}>
            <ButtonText>Open card</ButtonText>
          </Button>
        </View>
      ) : null}
    </View>
  );
}

function WishlistLoadingSkeleton() {
  return (
    <SkeletonGroup>
      <View className="gap-0">
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={index} className="flex-row items-center gap-3 border-b border-border py-3">
            <Skeleton className="h-14 w-10 rounded-md" />
            <View className="min-w-0 flex-1 gap-2">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </View>
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-4 w-14 rounded" />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

function WishlistScreenBody() {
  const router = useRouter();
  const { contentWidth, paddingBottomInline } = useScreenLayout();
  const [sort, setSort] = useState<SortMode>('move');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const wishlist = useWishlistPrices();
  const items = wishlist.data ?? [];

  const filtered = useMemo(
    () => sortItems(items.filter((item) => matchesQuery(item, query)), sort),
    [items, query, sort]
  );

  const atTargetCount = useMemo(
    () => items.filter((item) => item.belowTarget).length,
    [items]
  );

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const openItem = useCallback(
    (variantNumber: string) => {
      openCard(router, variantNumber, 'modal', 'wishlist');
    },
    [router]
  );

  const listHeader = (
    <View className="gap-4 pb-2">
      <View>
        <Text className="text-xl font-semibold tracking-tight text-foreground">Wishlist</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {items.length === 0
            ? 'Track cards you want and watch Cardmarket trend prices.'
            : `${String(items.length)} ${items.length === 1 ? 'card' : 'cards'}${
                atTargetCount > 0 ? ` · ${String(atTargetCount)} at target` : ''
              }`}
        </Text>
      </View>

      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or variant"
        accessibilityLabel="Search wishlist"
        className="min-h-12 rounded-xl border-border bg-card"
      />

      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <Text className="text-xs text-muted-foreground">Last 30 days</Text>
        <View className="flex-row items-center gap-1" accessibilityRole="tablist">
          {(
            [
              { value: 'move', label: 'Move' },
              { value: 'price', label: 'Price' },
              { value: 'name', label: 'Name' },
            ] as const
          ).map((option) => {
            const active = sort === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setSort(option.value);
                }}
                className={cn(
                  'min-h-9 rounded-md px-2.5 py-1.5',
                  active ? 'bg-secondary' : 'active:opacity-70'
                )}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text
                  className={cn(
                    'text-[12px]',
                    active ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {items.length > 0 ? (
        <View className="flex-row items-baseline justify-between border-b border-border pb-2">
          <Text className="text-xs text-muted-foreground">
            {query.trim()
              ? `${String(filtered.length)} match${filtered.length === 1 ? '' : 'es'}`
              : 'Tap a row for history'}
          </Text>
          <Text className="font-mono text-[10px] text-archive-subtle">EUR trend</Text>
        </View>
      ) : null}
    </View>
  );

  if (wishlist.isLoading) {
    return (
      <View style={{ width: contentWidth }} className="gap-4">
        {listHeader}
        <WishlistLoadingSkeleton />
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.variantNumber}
      ListHeaderComponent={listHeader}
      renderItem={({ item }) => (
        <WishlistRow
          item={item}
          expanded={expandedId === item.variantNumber}
          onToggle={() => {
            setExpandedId((current) =>
              current === item.variantNumber ? null : item.variantNumber
            );
          }}
          onOpen={() => {
            openItem(item.variantNumber);
          }}
        />
      )}
      ListEmptyComponent={
        <View className="py-10">
          {items.length === 0 ? (
            <View className="gap-3">
              <Text className="text-base font-semibold text-foreground">
                No wishlist cards yet
              </Text>
              <Text className="max-w-md text-sm leading-6 text-muted-foreground">
                Save a printing from the catalog. Your list stays compact so you can scan prices
                quickly, then expand a row when you want history.
              </Text>
              <Button
                className="mt-2 self-start"
                onPress={() => {
                  router.push('/(tabs)/search');
                }}
              >
                <ButtonText>Browse catalog</ButtonText>
              </Button>
            </View>
          ) : (
            <Text className="text-center text-sm text-muted-foreground">
              No cards match “{query.trim()}”.
            </Text>
          )}
        </View>
      }
      ListFooterComponent={
        items.length > 0 ? (
          <Text className="pb-2 pt-5 text-xs leading-5 text-muted-foreground">
            {CARDMARKET_PRICE_DETAIL_NOTE}
          </Text>
        ) : null
      }
      contentContainerStyle={{
        width: contentWidth,
        maxWidth: '100%',
        paddingBottom: paddingBottomInline,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={dismissKeyboard}
      showsVerticalScrollIndicator={false}
      extraData={expandedId}
      initialNumToRender={16}
      windowSize={9}
    />
  );
}

export default function WishlistScreen() {
  return (
    <ScreenLayout mode="flex" contentClassName="flex-1">
      <ScreenLayoutBody>
        <WishlistScreenBody />
      </ScreenLayoutBody>
    </ScreenLayout>
  );
}
