import type { PriceDailyPoint } from '@riftbound/contracts';

export interface WishlistPricePoint {
  priceDate: string;
  label: string;
  value: number;
}

/** Format a UTC `YYYY-MM-DD` price snapshot for chart axis labels. */
export function formatPricePointDate(priceDate: string): string {
  const day = priceDate.slice(0, 10);
  const date = new Date(`${day}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return day || priceDate;
  // Force UTC so calendar days never shift by local timezone.
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Which axis labels to show under a bar series.
 * Always first + last; short series show every date; longer series keep sparse mid labels.
 */
export function shouldShowPricePointLabel(index: number, total: number): boolean {
  if (total <= 0) return false;
  if (total <= 5) return true;
  if (index === 0 || index === total - 1) return true;
  const midSlots = Math.min(3, total - 2);
  if (midSlots <= 0) return false;
  const step = (total - 1) / (midSlots + 1);
  for (let slot = 1; slot <= midSlots; slot += 1) {
    if (index === Math.round(step * slot)) return true;
  }
  return false;
}

function trendValue(
  point: Pick<PriceDailyPoint, 'marketPrice' | 'midPrice' | 'lowPrice'>
): number | null {
  return point.marketPrice ?? point.midPrice ?? point.lowPrice ?? null;
}

/** Keep only days with a trend price, label with real dates (never "Now"). */
export function toWishlistChartPoints(
  statsPoints: PriceDailyPoint[] | undefined
): WishlistPricePoint[] {
  const withValues = (statsPoints ?? [])
    .map((point) => {
      const value = trendValue(point);
      if (value == null) return null;
      return {
        priceDate: point.priceDate,
        value,
      };
    })
    .filter((point): point is { priceDate: string; value: number } => point != null);

  return withValues.map((point, index, all) => ({
    priceDate: point.priceDate,
    value: point.value,
    label: shouldShowPricePointLabel(index, all.length)
      ? formatPricePointDate(point.priceDate)
      : '',
  }));
}
