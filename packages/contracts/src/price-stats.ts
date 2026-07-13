import type { PriceTrend } from './prices.js';

export function formatTrendLabel(changePercent: number | null, trend: PriceTrend): string {
  if (changePercent == null || trend === 'flat') return 'Flat';
  return changePercent > 0 ? `+${String(changePercent)}%` : `${String(changePercent)}%`;
}
