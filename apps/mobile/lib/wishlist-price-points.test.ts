import { describe, expect, test } from 'bun:test';
import type { PriceDailyPoint } from '@riftbound/contracts';
import {
  formatPricePointDate,
  shouldShowPricePointLabel,
  toWishlistChartPoints,
} from '../lib/wishlist-price-points';

function point(
  priceDate: string,
  marketPrice: number | null,
  midPrice: number | null = null
): PriceDailyPoint {
  return {
    cardmarketId: 1,
    isFoil: false,
    provider: 'cardmarket',
    currency: 'EUR',
    priceDate,
    lowPrice: null,
    marketPrice,
    midPrice,
    highPrice: null,
  };
}

describe('formatPricePointDate', () => {
  test('formats UTC price dates as short month + day without local TZ shift', () => {
    expect(formatPricePointDate('2026-07-22')).toBe(
      new Date('2026-07-22T12:00:00.000Z').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    );
    expect(formatPricePointDate('2026-07-22')).toMatch(/22/);
  });
});

describe('shouldShowPricePointLabel', () => {
  test('shows every label for short series', () => {
    expect([0, 1, 2, 3].map((i) => shouldShowPricePointLabel(i, 4))).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  test('always shows first and last for longer series', () => {
    expect(shouldShowPricePointLabel(0, 12)).toBe(true);
    expect(shouldShowPricePointLabel(11, 12)).toBe(true);
  });
});

describe('toWishlistChartPoints', () => {
  test('drops days without a trend value and never labels the last point as Now', () => {
    const points = toWishlistChartPoints([
      point('2026-07-18', 1.1),
      point('2026-07-19', null, null),
      point('2026-07-20', null, 1.4),
      point('2026-07-22', 1.6),
    ]);

    expect(points.map((p) => p.priceDate)).toEqual([
      '2026-07-18',
      '2026-07-20',
      '2026-07-22',
    ]);
    expect(points.every((p) => p.label !== 'Now')).toBe(true);
    expect(points.at(-1)?.label).toMatch(/Jul/);
    expect(points.at(-1)?.label).toMatch(/22/);
    expect(points.every((p) => typeof p.value === 'number')).toBe(true);
  });

  test('returns an empty list when no trend values exist', () => {
    expect(toWishlistChartPoints([point('2026-07-22', null, null)])).toEqual([]);
    expect(toWishlistChartPoints(undefined)).toEqual([]);
  });

  test('falls back to lowPrice when trend and mid are missing', () => {
    const points = toWishlistChartPoints([
      {
        cardmarketId: 1,
        isFoil: false,
        provider: 'cardmarket',
        currency: 'EUR',
        priceDate: '2026-07-21',
        lowPrice: 1.25,
        marketPrice: null,
        midPrice: null,
        highPrice: null,
      },
    ]);
    expect(points).toEqual([
      {
        priceDate: '2026-07-21',
        value: 1.25,
        label: formatPricePointDate('2026-07-21'),
      },
    ]);
  });
});
