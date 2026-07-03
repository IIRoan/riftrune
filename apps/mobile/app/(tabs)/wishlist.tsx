import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { TrendTag } from '@/components/catalog/TrendTag';
import {
  CollectionListPanel,
  WishlistRow,
} from '@/components/collection/CollectionDashboard';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  useWishlistPrices,
  type WishlistPriceItem,
  type WishlistRange,
} from '@/hooks/useWishlistPrices';
import { cn } from '@/lib/utils';
import { openCard } from '@/utils/cardNavigation';

const RANGES: { value: WishlistRange; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

function formatPrice(value: number | null): string {
  return value == null ? '—' : `€${value.toFixed(2)}`;
}

function PriceBars({ item }: { item: WishlistPriceItem }) {
  const values = item.points
    .map((point) => point.value)
    .filter((value): value is number => value != null);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const range = Math.max(max - min, 0.01);

  return (
    <View className="mt-4 flex-row items-end gap-2">
      {item.points.length > 0 ? (
        item.points.map((point, index) => {
          const pct = point.value == null ? 0 : (point.value - min) / range;
          const height = point.value == null ? 6 : 12 + pct * 52;
          const active = index === item.points.length - 1;
          return (
            <View key={`${point.label}-${String(index)}`} className="flex-1 items-center gap-1.5">
              <View
                className={cn(
                  'w-full rounded-full bg-archive-soft-line',
                  active && 'bg-primary'
                )}
                style={{ height }}
              />
              <Text className="font-mono text-[9px] text-archive-subtle" numberOfLines={1}>
                {point.label}
              </Text>
            </View>
          );
        })
      ) : (
        <Text className="py-3 text-xs text-muted-foreground">No stored price history yet</Text>
      )}
    </View>
  );
}

function WishlistCard({
  item,
  range,
}: {
  item: WishlistPriceItem;
  range: WishlistRange;
}) {
  const router = useRouter();
  return (
    <Pressable
      className="rounded-xl border border-border bg-card p-3 active:opacity-90"
      onPress={() => {
        openCard(router, item.variantNumber, 'modal', 'wishlist');
      }}
    >
      <View className="flex-row gap-3">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="h-[92px] w-[66px] rounded-md"
            contentFit="cover"
            contentPosition="top"
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="h-[92px] w-[66px] items-center justify-center rounded-md bg-card-panel">
            <Ionicons name="bookmark-outline" size={20} className="text-muted-foreground" />
          </View>
        )}

        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="mt-0.5 font-mono text-[11px] text-archive-subtle">
                {item.variantNumber}
              </Text>
            </View>
            <View className="items-end">
              <Text className="font-mono text-lg font-bold tabular-nums text-foreground">
                {formatPrice(item.currentPrice)}
              </Text>
              <TrendTag trend={item.trend} />
            </View>
          </View>

          <PriceBars item={item} />

          <Text className="mt-2 font-mono text-[11px] text-archive-subtle">
            {range.toUpperCase()} baseline {formatPrice(item.baselinePrice)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function trendDelta(trend: string): number {
  if (trend === 'Flat') return 0;
  const parsed = Number(trend.replace('%', ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function WishlistScreen() {
  const router = useRouter();
  const [range, setRange] = useState<WishlistRange>('7d');
  const wishlist = useWishlistPrices(range);
  const items = wishlist.data ?? [];
  const movers = [...items]
    .sort((a, b) => Math.abs(trendDelta(b.trend)) - Math.abs(trendDelta(a.trend)))
    .slice(0, 5);

  return (
    <ScreenLayout>
      <View className="pb-6">
        <View className="flex-row items-start justify-between gap-4">
          <View className="min-w-0 flex-1">
            <Text className="text-xl font-semibold tracking-tight text-foreground">
              Wishlist
            </Text>
            <Text className="mt-1 font-mono text-[13px] text-muted-foreground">
              {items.length} wishlisted cards · stored price history
            </Text>
          </View>
          <View className="flex-row rounded-lg border border-border bg-card p-0.5">
            {RANGES.map((option) => {
              const active = option.value === range;
              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'h-8 w-auto rounded-md px-3',
                    active ? 'bg-primary' : 'bg-transparent'
                  )}
                  onPress={() => {
                    setRange(option.value);
                  }}
                >
                  <ButtonText
                    className={cn(
                      'font-mono text-xs',
                      active ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {option.label}
                  </ButtonText>
                </Button>
              );
            })}
          </View>
        </View>
      </View>

      <View className="gap-3 pb-8">
        <CollectionListPanel title="Week movers" subtitle={range.toUpperCase()}>
          {wishlist.isLoading ? (
            <Text className="py-6 text-center text-sm text-muted-foreground">
              Loading movers…
            </Text>
          ) : movers.length > 0 ? (
            movers.map((item, i) => (
              <View key={item.variantNumber}>
                {i > 0 ? <View className="h-hairline bg-archive-soft-line" /> : null}
                <WishlistRow
                  name={item.name}
                  variantNumber={item.variantNumber}
                  price={formatPrice(item.currentPrice)}
                  trend={item.trend}
                  onPress={() => {
                    openCard(router, item.variantNumber, 'modal', 'wishlist');
                  }}
                />
              </View>
            ))
          ) : (
            <Text className="py-6 text-center text-sm text-muted-foreground">
              No stored wishlist price movement yet.
            </Text>
          )}
        </CollectionListPanel>

        <View className="flex-row items-baseline justify-between pt-3">
          <Text className="text-sm font-semibold text-foreground">Wishlisted items</Text>
          <Text className="font-mono text-xs text-archive-subtle">
            {items.length} cards
          </Text>
        </View>

        {wishlist.isLoading ? (
          <Text className="py-12 text-center text-sm text-muted-foreground">
            Loading wishlist…
          </Text>
        ) : items.length > 0 ? (
          items.map((item) => (
            <WishlistCard key={item.variantNumber} item={item} range={range} />
          ))
        ) : (
          <View className="rounded-xl border border-dashed border-border p-6">
            <Text className="text-base font-semibold text-foreground">
              No wishlist cards
            </Text>
            <Text className="mt-2 text-sm leading-6 text-muted-foreground">
              Add a card variant from the catalog to start tracking stored price history.
            </Text>
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}
