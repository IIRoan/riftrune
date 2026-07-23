import { useQuery } from '@tanstack/react-query';
import type { PriceStats } from '@riftbound/contracts';
import { formatTrendLabel } from '@riftbound/contracts';
import {
  toWishlistChartPoints,
  type WishlistPricePoint,
} from '@/lib/wishlist-price-points';
import { api } from '@/src/api/client';
import { priceQueryKeys } from '@/src/api/queryKeys';

/** Shared window with wishlist charts. */
export const PRICE_HISTORY_DAYS = 30;

/** Minimal chart input — shared by wishlist rows and card detail. */
export type PriceHistoryPanelItem = {
  points: WishlistPricePoint[];
  trend: string;
  baselinePrice: number | null;
  listingLow: number | null;
};

export function priceHistoryFromStats(
  stats: PriceStats | undefined
): PriceHistoryPanelItem | null {
  if (!stats) return null;
  return {
    points: toWishlistChartPoints(stats.points),
    trend: formatTrendLabel(stats.changePercent ?? null, stats.trend),
    baselinePrice: stats.baselinePrice,
    listingLow: stats.listingLow,
  };
}

/** 30-day Cardmarket trend for a single printing (card detail / drawer). */
export function useVariantPriceHistory(
  variantNumber: string | undefined,
  options?: { isFoil?: boolean; enabled?: boolean }
) {
  const enabled = Boolean(variantNumber) && (options?.enabled ?? true);
  const isFoil = options?.isFoil ?? false;

  const query = useQuery({
    queryKey: priceQueryKeys.stats(variantNumber ?? '', isFoil, PRICE_HISTORY_DAYS),
    queryFn: async (): Promise<PriceStats | undefined> => {
      const res = await api.getPriceStatsBatch({
        days: PRICE_HISTORY_DAYS,
        items: [{ variantNumber: variantNumber!, isFoil }],
      });
      return res.data[0];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    panelItem: priceHistoryFromStats(query.data),
  };
}
