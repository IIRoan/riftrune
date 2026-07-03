import { useQuery } from '@tanstack/react-query';
import type { PriceHistoryPoint, PriceRow } from '@riftbound/contracts';
import { getWishlist, type WishlistEntry } from '@/services/wishlistService';
import { api } from '@/src/api/client';
import { wishlistQueryKeys } from '@/src/api/queryKeys';
import { isFoilVariant } from '@/utils/variants';

export type WishlistRange = '1d' | '7d' | '30d';

export interface WishlistPricePoint {
  label: string;
  value: number | null;
}

export interface WishlistPriceItem extends WishlistEntry {
  currentPrice: number | null;
  baselinePrice: number | null;
  trend: string;
  points: WishlistPricePoint[];
}

function amount(value: number | null | undefined): number | null {
  return value == null ? null : value;
}

type PriceLike = PriceRow | PriceHistoryPoint;

function currentAmount(row: PriceLike | undefined): number | null {
  if (!row) return null;
  return amount(row.marketPrice) ?? amount(row.lowPrice);
}

function baselineAmount(row: PriceLike | undefined, range: WishlistRange): number | null {
  if (!row) return null;
  if (range === '1d') return amount(row.avg1Day);
  if (range === '30d') return amount(row.avg30Day);
  return amount(row.avg7Day);
}

function formatTrend(current: number | null, baseline: number | null): string {
  if (current == null || baseline == null || baseline === 0) return 'Flat';
  const pct = Math.round(((current - baseline) / baseline) * 100);
  if (pct >= 5) return `+${String(pct)}%`;
  if (pct <= -5) return `${String(pct)}%`;
  return 'Flat';
}

function pointLabel(value: string, index: number, total: number): string {
  if (total <= 4) return index === total - 1 ? 'Now' : value;
  if (index === 0) return value;
  if (index === total - 1) return 'Now';
  return '';
}

function findExactPriceRow(rows: PriceRow[], isFoil: boolean): PriceRow | undefined {
  return rows.find((row) => row.isFoil === isFoil) ?? rows[0];
}

async function loadDbPriceHistory({
  variantNumber,
  isFoil,
  range,
}: {
  variantNumber: string;
  isFoil: boolean;
  range: WishlistRange;
}): Promise<PriceLike[]> {
  const days = range === '1d' ? 1 : range === '30d' ? 30 : 7;
  const history = await api
    .getPriceHistory({ variantNumber, isFoil, days })
    .then((res) => res.data)
    .catch(() => []);

  if (history.length > 0) return history;

  const current = await api
    .getPrices({ variantNumber, isFoil })
    .then((res) => findExactPriceRow(res.data, isFoil))
    .catch(() => undefined);

  return current ? [current] : [];
}

function pricePoints(rows: PriceLike[]): WishlistPricePoint[] {
  if (rows.length === 0) return [];

  return rows.map((row, index) => {
    const date = new Date(row.lastUpdated);
    const label = Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      label: pointLabel(label, index, rows.length),
      value: currentAmount(row),
    };
  });
}

export function useWishlistPrices(range: WishlistRange, enabled = true) {
  return useQuery({
    queryKey: [...wishlistQueryKeys.all, 'prices', range] as const,
    queryFn: async (): Promise<WishlistPriceItem[]> => {
      const wishlist = await getWishlist();
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

      return Promise.all(
        wishlist.map(async (item) => {
          const card = cardByVariant.get(item.variantNumber);
          const variant = variantByNumber.get(item.variantNumber);
          const isFoil =
            variant != null
              ? isFoilVariant(
                  variant.variantNumber,
                  variant.variantLabel,
                  variant.variantType
                )
              : false;
          const priceRows = await loadDbPriceHistory({
            variantNumber: item.variantNumber,
            isFoil,
            range,
          });
          const priceRow = priceRows.at(-1);
          const current = currentAmount(priceRow);
          const baseline =
            priceRows.length > 1
              ? currentAmount(priceRows[0])
              : baselineAmount(priceRow, range);

          return {
            ...item,
            name: card?.name ?? item.name,
            imageUrl: variant?.imageUrl ?? item.imageUrl,
            currentPrice: current,
            baselinePrice: baseline,
            trend: formatTrend(current, baseline),
            points: pricePoints(priceRows),
          };
        })
      );
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
