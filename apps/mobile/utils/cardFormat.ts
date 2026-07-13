import { pickVariantDisplayPrice } from '@/utils/variants';

export function formatCardPrice(
  prices: { market: number | null; low: number | null; isFoil: boolean }[],
  variant: {
    variantNumber: string;
    variantLabel: string;
    variantType?: string;
  }
): string | null {
  const row = pickVariantDisplayPrice(prices, variant);
  const amount = row?.market;
  return amount != null ? `€${amount.toFixed(2)}` : null;
}

export function formatStat(value: number): string {
  return value > 0 ? String(value) : '—';
}
