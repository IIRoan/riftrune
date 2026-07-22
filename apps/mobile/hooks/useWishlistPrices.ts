import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PriceStats, PriceTrend } from '@riftbound/contracts';
import {
  CARDMARKET_PRICE_SCOPE_NOTE,
  cardmarketPriceScopeLabel,
  formatTrendLabel,
} from '@riftbound/contracts';
import { getWishlist, type WishlistEntry } from '@/services/wishlistService';
import { api } from '@/src/api/client';
import { wishlistQueryKeys } from '@/src/api/queryKeys';
import {
  toWishlistChartPoints,
  type WishlistPricePoint,
} from '@/lib/wishlist-price-points';
import { isFoilVariant } from '@/utils/variants';

/** Fixed history window for wishlist price charts. */
export const WISHLIST_PRICE_DAYS = 30;

export type { WishlistPricePoint } from '@/lib/wishlist-price-points';
export {
  formatPricePointDate,
  shouldShowPricePointLabel,
  toWishlistChartPoints,
} from '@/lib/wishlist-price-points';

export interface WishlistPriceItem extends WishlistEntry {
  currentPrice: number | null;
  baselinePrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  avgPrice: number | null;
  listingLow: number | null;
  changePercent: number | null;
  trend: string;
  trendDirection: PriceTrend;
  belowTarget: boolean;
  targetPriceCents: number | null;
  priceFilterLabel: string;
  priceSourceNote: string;
  dataPointCount: number;
  points: WishlistPricePoint[];
}

function toWishlistPriceItem(
  entry: WishlistEntry & {
    priority?: number;
    targetPriceCents?: number | null;
  },
  stats: PriceStats | undefined
): WishlistPriceItem {
  const points = toWishlistChartPoints(stats?.points);

  return {
    ...entry,
    currentPrice: stats?.currentPrice ?? null,
    baselinePrice: stats?.baselinePrice ?? null,
    minPrice: stats?.minPrice ?? null,
    maxPrice: stats?.maxPrice ?? null,
    avgPrice: stats?.avgPrice ?? null,
    listingLow: stats?.listingLow ?? null,
    changePercent: stats?.changePercent ?? null,
    trend: formatTrendLabel(stats?.changePercent ?? null, stats?.trend ?? 'flat'),
    trendDirection: stats?.trend ?? 'flat',
    belowTarget: stats?.belowTarget ?? false,
    targetPriceCents: stats?.targetPriceCents ?? entry.targetPriceCents ?? null,
    priceFilterLabel: stats?.priceFilterLabel ?? cardmarketPriceScopeLabel(false),
    priceSourceNote: stats?.priceSourceNote ?? CARDMARKET_PRICE_SCOPE_NOTE,
    dataPointCount: points.length,
    points,
  };
}

export function useWishlistPrices(enabled = true) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: wishlistQueryKeys.prices,
    queryFn: async (): Promise<WishlistPriceItem[]> => {
      // fetchQuery (not ensureQueryData): after wishlist add/remove, membership
      // may be invalidated but still cached — ensureQueryData would reuse it.
      const wishlist = await queryClient.fetchQuery({
        queryKey: wishlistQueryKeys.all,
        queryFn: getWishlist,
      });
      if (wishlist.length === 0) return [];

      const batch = await api.batchCards(wishlist.map((item) => item.variantNumber));
      const cardByVariant = new Map<string, (typeof batch.data)[number]>();
      const variantByNumber = new Map<
        string,
        (typeof batch.data)[number]['variants'][number]
      >();

      for (const card of batch.data) {
        for (const variant of card.variants) {
          cardByVariant.set(variant.variantNumber, card);
          variantByNumber.set(variant.variantNumber, variant);
        }
      }

      const statsResponse = await api.getPriceStatsBatch({
        days: WISHLIST_PRICE_DAYS,
        items: wishlist.map((item) => {
          const variant = variantByNumber.get(item.variantNumber);
          const isFoil =
            variant != null
              ? isFoilVariant(
                  variant.variantNumber,
                  variant.variantLabel,
                  variant.variantType
                )
              : false;
          return {
            variantNumber: item.variantNumber,
            isFoil,
            targetPriceCents: item.targetPriceCents,
          };
        }),
      });

      const statsByVariant = new Map(
        statsResponse.data.map((stats) => [stats.variantNumber, stats] as const)
      );

      return wishlist.map((item) => {
        const card = cardByVariant.get(item.variantNumber);
        const variant = variantByNumber.get(item.variantNumber);
        const stats = statsByVariant.get(item.variantNumber);

        return toWishlistPriceItem(
          {
            ...item,
            name: card?.name ?? item.name,
            imageUrl: variant?.imageUrl ?? item.imageUrl,
          },
          stats
        );
      });
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
