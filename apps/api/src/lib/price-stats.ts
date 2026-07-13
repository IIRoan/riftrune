export const TREND_THRESHOLD_PCT = 5;

export type DailyPricePoint = {
  priceDate: string;
  lowPrice: number | null;
  marketPrice: number | null;
  midPrice: number | null;
  highPrice: number | null;
};

export type PriceTrend = 'up' | 'down' | 'flat';

export function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Cardmarket trend price — never the unfiltered cheapest listing. */
export function trendPrice(row: DailyPricePoint): number | null {
  return row.marketPrice ?? row.midPrice ?? null;
}

/** Cheapest marketplace listing (any language / condition). */
export function listingLowPrice(row: DailyPricePoint): number | null {
  return row.lowPrice;
}

/** @deprecated Use trendPrice — kept as alias for internal callers. */
export function primaryPrice(row: DailyPricePoint): number | null {
  return trendPrice(row);
}

export function computeTrend(
  current: number | null,
  baseline: number | null
): { changePercent: number | null; trend: PriceTrend } {
  if (current == null || baseline == null || baseline === 0) {
    return { changePercent: null, trend: 'flat' };
  }

  const changePercent = Math.round(((current - baseline) / baseline) * 100);
  if (changePercent >= TREND_THRESHOLD_PCT) {
    return { changePercent, trend: 'up' };
  }
  if (changePercent <= -TREND_THRESHOLD_PCT) {
    return { changePercent, trend: 'down' };
  }
  return { changePercent, trend: 'flat' };
}

export function formatTrendLabel(changePercent: number | null, trend: PriceTrend): string {
  if (changePercent == null || trend === 'flat') return 'Flat';
  return changePercent > 0 ? `+${String(changePercent)}%` : `${String(changePercent)}%`;
}

export function computePriceStats(points: DailyPricePoint[]) {
  const sorted = [...points].sort((a, b) => a.priceDate.localeCompare(b.priceDate));
  const trendValues = sorted
    .map((point) => trendPrice(point))
    .filter((value): value is number => value != null);

  const currentPrice =
    sorted.length > 0 ? trendPrice(sorted[sorted.length - 1]!) : null;
  const baselinePrice = sorted.length > 0 ? trendPrice(sorted[0]!) : null;
  const minPrice = trendValues.length > 0 ? Math.min(...trendValues) : null;
  const maxPrice = trendValues.length > 0 ? Math.max(...trendValues) : null;
  const avgPrice =
    trendValues.length > 0
      ? trendValues.reduce((sum, value) => sum + value, 0) / trendValues.length
      : null;
  const listingLow =
    sorted.length > 0 ? listingLowPrice(sorted[sorted.length - 1]!) : null;
  const { changePercent, trend } = computeTrend(currentPrice, baselinePrice);

  return {
    currentPrice,
    baselinePrice,
    minPrice,
    maxPrice,
    avgPrice,
    listingLow,
    changePercent,
    trend,
    points: sorted,
  };
}
