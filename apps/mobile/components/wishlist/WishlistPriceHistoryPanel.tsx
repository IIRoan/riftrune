import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { TrendTag } from '@/components/catalog/TrendTag';
import { Text } from '@/components/ui/text';
import type { WishlistPriceItem, WishlistPricePoint } from '@/hooks/useWishlistPrices';
import { formatPricePointDate } from '@/lib/wishlist-price-points';
import { cn } from '@/lib/utils';

function formatPrice(value: number | null): string {
  return value == null ? '—' : `€${value.toFixed(2)}`;
}

function pointDisplayLabel(point: WishlistPricePoint): string {
  return point.label || formatPricePointDate(point.priceDate);
}

/**
 * Interactive daily trend history — every bar shows its EUR price; tap to highlight a day.
 */
export function WishlistPriceHistoryPanel({
  item,
  className,
}: {
  item: WishlistPriceItem;
  className?: string;
}) {
  const points = item.points;
  const [selectedDate, setSelectedDate] = useState<string | null>(
    points.at(-1)?.priceDate ?? null
  );

  useEffect(() => {
    const latest = points.at(-1)?.priceDate ?? null;
    setSelectedDate((current) => {
      if (current != null && points.some((point) => point.priceDate === current)) {
        return current;
      }
      return latest;
    });
  }, [points]);

  const selected =
    points.find((point) => point.priceDate === selectedDate) ?? points.at(-1) ?? null;

  if (points.length === 0) {
    return (
      <View className={cn('rounded-xl border border-border bg-card p-3', className)}>
        <Text className="text-xs leading-5 text-muted-foreground">
          No daily trend snapshots yet. Prices sync once per day from Cardmarket.
        </Text>
      </View>
    );
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.01);
  const first = points[0]!;
  const last = points.at(-1)!;
  const dense = points.length > 8;

  return (
    <View className={cn('rounded-xl border border-border bg-card p-3', className)}>
      <View className="mb-3 flex-row items-center justify-between gap-3">
        <Text className="text-[11px] text-muted-foreground">
          {pointDisplayLabel(first)}
          {points.length > 1 ? ` – ${pointDisplayLabel(last)}` : ''}
          {` · ${String(points.length)} day${points.length === 1 ? '' : 's'}`}
        </Text>
        <TrendTag trend={item.trend} />
      </View>

      <View className={cn('flex-row items-end gap-1', dense ? 'h-[100px]' : 'h-[108px]')}>
        {points.map((point) => {
          const pct = (point.value - min) / span;
          const barHeight = 10 + pct * (dense ? 44 : 52);
          const isSelected = point.priceDate === selected?.priceDate;
          return (
            <Pressable
              key={point.priceDate}
              onPress={() => {
                setSelectedDate(point.priceDate);
              }}
              className="min-w-0 flex-1 items-center justify-end gap-1"
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${pointDisplayLabel(point)}, ${formatPrice(point.value)}`}
            >
              <Text
                className={cn(
                  'font-mono tabular-nums',
                  dense ? 'text-[8px]' : 'text-[10px]',
                  isSelected
                    ? 'font-bold text-foreground'
                    : 'font-medium text-muted-foreground'
                )}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatPrice(point.value)}
              </Text>
              <View
                className={cn(
                  'w-full max-w-6 rounded-t-sm',
                  isSelected ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
                style={{ height: barHeight }}
              />
              <Text
                className={cn(
                  'font-mono text-[9px] tabular-nums',
                  isSelected ? 'font-semibold text-foreground' : 'text-archive-subtle'
                )}
                numberOfLines={1}
              >
                {isSelected || point.label || points.length <= 5
                  ? pointDisplayLabel(point)
                  : ' '}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2">
        <Text className="font-mono text-[11px] text-muted-foreground">
          Start{' '}
          <Text className="font-semibold text-foreground">
            {formatPrice(item.baselinePrice)}
          </Text>
        </Text>
        <Text className="font-mono text-[11px] text-muted-foreground">
          List low{' '}
          <Text className="font-semibold text-foreground">
            {formatPrice(item.listingLow)}
          </Text>
        </Text>
      </View>
    </View>
  );
}
