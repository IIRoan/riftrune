import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { TrendTag } from '@/components/catalog/TrendTag';
import { CollectionListPanel, WishlistRow } from '@/components/collection/CollectionDashboard';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { Button, ButtonText } from '@/components/ui/button';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import {
  useWishlistPrices,
  type WishlistPriceItem,
  type WishlistRange,
} from '@/hooks/useWishlistPrices';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';
import { openCard } from '@/utils/cardNavigation';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { CARDMARKET_PRICE_DETAIL_NOTE } from '@riftbound/contracts';

const RANGES: { value: WishlistRange; label: string; title: string }[] = [
  { value: '1d', label: '1D', title: 'Today' },
  { value: '7d', label: '7D', title: '7 days' },
  { value: '30d', label: '30D', title: '30 days' },
];

function formatPrice(value: number | null): string {
  return value == null ? '—' : `€${value.toFixed(2)}`;
}

function rangeMeta(range: WishlistRange) {
  return RANGES.find((option) => option.value === range) ?? RANGES[1]!;
}

function trendDelta(item: WishlistPriceItem): number {
  return item.changePercent ?? 0;
}

function PriceStatCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View className="min-w-0 flex-1 rounded-lg bg-card-panel px-2.5 py-2">
      <Text className="text-[10px] font-medium text-muted-foreground">{label}</Text>
      <Text className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums text-foreground">
        {value}
      </Text>
      {hint ? (
        <Text className="mt-0.5 text-[9px] leading-4 text-archive-subtle">{hint}</Text>
      ) : null}
    </View>
  );
}

function TrendHistoryChart({ item }: { item: WishlistPriceItem }) {
  const values = item.points
    .map((point) => point.value)
    .filter((value): value is number => value != null);

  if (values.length === 0) {
    return (
      <View className="mt-3 rounded-lg bg-card-panel px-3 py-3">
        <Text className="text-xs leading-5 text-muted-foreground">
          No daily trend history yet. Cardmarket prices sync once per day — check back after the
          next sync.
        </Text>
      </View>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.01);

  return (
    <View className="mt-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-mono text-[10px] text-archive-subtle">
          Trend low {formatPrice(min)}
        </Text>
        <Text className="font-mono text-[10px] text-archive-subtle">
          Trend high {formatPrice(max)}
        </Text>
      </View>
      <View className="flex-row items-end gap-1.5">
        {item.points.map((point, index) => {
          const pct = point.value == null ? 0 : (point.value - min) / span;
          const height = point.value == null ? 6 : 10 + pct * 48;
          const active = index === item.points.length - 1;
          return (
            <View key={`${point.label}-${String(index)}`} className="flex-1 items-center gap-1">
              <View
                className={cn(
                  'w-full rounded-sm bg-archive-soft-line',
                  active && 'bg-primary'
                )}
                style={{ height }}
                accessibilityLabel={
                  point.value == null
                    ? `${point.label || 'day'}: no trend`
                    : `${point.label || 'day'} trend ${formatPrice(point.value)}`
                }
              />
              {point.label ? (
                <Text className="font-mono text-[9px] text-archive-subtle" numberOfLines={1}>
                  {point.label}
                </Text>
              ) : (
                <View className="h-[11px]" />
              )}
            </View>
          );
        })}
      </View>
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
  const meta = rangeMeta(range);
  const targetPrice =
    item.targetPriceCents != null ? item.targetPriceCents / 100 : null;

  return (
    <Pressable
      className="rounded-xl border border-border bg-card p-3 active:opacity-90"
      onPress={() => {
        openCard(router, item.variantNumber, 'modal', 'wishlist');
      }}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, trend ${formatPrice(item.currentPrice)}, ${item.trend}`}
    >
      <View className="flex-row gap-3">
        {item.imageUrl ? (
          <Image
            source={{ uri: resolveImageUrl(item.imageUrl) }}
            className="h-[92px] w-[66px] rounded-md"
            contentFit="cover"
            contentPosition="top"
            cachePolicy="memory-disk"
            accessibilityLabel={item.name}
          />
        ) : (
          <View className="h-[92px] w-[66px] items-center justify-center rounded-md bg-card-panel">
            <ThemedIonicon name="bookmark-outline" size={20} color="muted-foreground" />
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
              <Text className="mt-1 font-mono text-[10px] text-archive-subtle">
                {item.priceFilterLabel}
              </Text>
            </View>
            <View className="items-end">
              <Text className="font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Trend
              </Text>
              <Text className="font-mono text-lg font-bold tabular-nums text-foreground">
                {formatPrice(item.currentPrice)}
              </Text>
              <TrendTag trend={item.trend} />
            </View>
          </View>

          <TrendHistoryChart item={item} />

          <View className="mt-3 flex-row flex-wrap gap-2">
            <PriceStatCell
              label={`${meta.title} start`}
              value={formatPrice(item.baselinePrice)}
              hint="trend"
            />
            <PriceStatCell label="Avg trend" value={formatPrice(item.avgPrice)} />
            <PriceStatCell
              label="Cheapest listing"
              value={formatPrice(item.listingLow)}
              hint="any language"
            />
          </View>

          {targetPrice != null ? (
            <View className="mt-3 flex-row items-center justify-between rounded-lg bg-card-panel px-3 py-2">
              <Text className="text-xs text-muted-foreground">Target (trend)</Text>
              <View className="flex-row items-center gap-2">
                <Text className="font-mono text-xs font-semibold tabular-nums text-foreground">
                  {formatPrice(targetPrice)}
                </Text>
                {item.belowTarget ? (
                  <Text className="font-mono text-[11px] font-semibold text-success">At target</Text>
                ) : item.currentPrice != null && item.currentPrice > targetPrice ? (
                  <Text className="font-mono text-[11px] text-archive-subtle">
                    +{formatPrice(item.currentPrice - targetPrice)} above
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          <Text className="mt-2 text-[10px] leading-4 text-archive-subtle">{item.priceSourceNote}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function WishlistLoadingSkeleton() {
  return (
    <SkeletonGroup>
      <View className="gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[200px] w-full rounded-xl" />
        ))}
      </View>
    </SkeletonGroup>
  );
}

export default function WishlistScreen() {
  const router = useRouter();
  const isMobile = useMobileLayout();
  const [range, setRange] = useState<WishlistRange>('7d');
  const wishlist = useWishlistPrices(range);
  const items = wishlist.data ?? [];
  const meta = rangeMeta(range);

  const movers = useMemo(
    () =>
      [...items]
        .sort((a, b) => Math.abs(trendDelta(b)) - Math.abs(trendDelta(a)))
        .slice(0, 5),
    [items]
  );

  const subtitle =
    items.length === 0
      ? 'Track cards you want · Cardmarket EUR trend prices'
      : `${String(items.length)} ${items.length === 1 ? 'card' : 'cards'} on your wishlist`;

  return (
    <ScreenLayout>
      <View className="pb-4">
        <View className={isMobile ? 'gap-4' : 'flex-row items-start justify-between gap-4'}>
          <View className="min-w-0 flex-1">
            <Text
              className={
                isMobile
                  ? 'text-lg font-semibold tracking-tight text-foreground'
                  : 'text-xl font-semibold tracking-tight text-foreground'
              }
            >
              Wishlist
            </Text>
            <Text className="mt-1 font-mono text-[13px] text-muted-foreground">{subtitle}</Text>
          </View>
          <View
            className={cn(
              'flex-row rounded-lg border border-border bg-card p-0.5',
              isMobile ? 'self-start' : 'shrink-0'
            )}
            accessibilityRole="tablist"
          >
            {RANGES.map((option) => {
              const active = option.value === range;
              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'min-h-11 w-auto rounded-md px-4',
                    active ? 'bg-primary' : 'bg-transparent'
                  )}
                  onPress={() => {
                    setRange(option.value);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
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

        <Text className="mt-3 text-xs leading-5 text-muted-foreground">
          {CARDMARKET_PRICE_DETAIL_NOTE}
        </Text>
      </View>

      <View className="gap-3 pb-8">
        <CollectionListPanel title="Top movers" subtitle={`${meta.title} · trend`}>
          {wishlist.isLoading ? (
            <Text className="py-6 text-center text-sm text-muted-foreground">Loading movers…</Text>
          ) : movers.length > 0 ? (
            movers.map((item, i) => (
              <View key={item.variantNumber}>
                {i > 0 ? <View className="h-hairline bg-archive-soft-line" /> : null}
                <WishlistRow
                  name={item.name}
                  variantNumber={item.variantNumber}
                  price={`Trend ${formatPrice(item.currentPrice)}`}
                  trend={item.trend}
                  onPress={() => {
                    openCard(router, item.variantNumber, 'modal', 'wishlist');
                  }}
                />
                <Text className="px-1 pb-2 font-mono text-[10px] text-archive-subtle">
                  Trend {formatPrice(item.baselinePrice)} → {formatPrice(item.currentPrice)} ·{' '}
                  {item.priceFilterLabel}
                </Text>
              </View>
            ))
          ) : (
            <Text className="py-6 text-center text-sm leading-6 text-muted-foreground">
              {items.length > 0
                ? 'No meaningful trend movement in this period. Need at least two daily snapshots.'
                : 'Add cards to your wishlist to track Cardmarket trend prices.'}
            </Text>
          )}
        </CollectionListPanel>

        <View className="flex-row items-baseline justify-between pt-3">
          <Text className="text-sm font-semibold text-foreground">Wishlisted cards</Text>
          <Text className="font-mono text-xs text-archive-subtle">
            {items.length} {items.length === 1 ? 'card' : 'cards'}
          </Text>
        </View>

        {wishlist.isLoading ? (
          <WishlistLoadingSkeleton />
        ) : items.length > 0 ? (
          items.map((item) => (
            <WishlistCard key={item.variantNumber} item={item} range={range} />
          ))
        ) : (
          <View className="rounded-xl border border-dashed border-border p-6">
            <Text className="text-base font-semibold text-foreground">No wishlist cards yet</Text>
            <Text className="mt-2 text-sm leading-6 text-muted-foreground">
              Add a card from the catalog. We track Cardmarket trend daily and show the cheapest
              marketplace listing separately so foreign-language copies do not skew the headline
              price.
            </Text>
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}
