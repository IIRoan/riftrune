import { z } from 'zod';

export const PriceRow = z.object({
  id: z.string().uuid(),
  cardmarketId: z.number().int(),
  isFoil: z.boolean(),
  provider: z.literal('cardmarket'),
  currency: z.literal('EUR'),
  lowPrice: z.number().nullable(),
  marketPrice: z.number().nullable(),
  midPrice: z.number().nullable(),
  highPrice: z.number().nullable(),
  avg1Day: z.number().nullable(),
  avg7Day: z.number().nullable(),
  avg30Day: z.number().nullable(),
  lastUpdated: z.string().datetime(),
});

/** One stored price observation per cardmarket listing per UTC calendar day. */
export const PriceDailyPoint = z.object({
  cardmarketId: z.number().int(),
  isFoil: z.boolean(),
  provider: z.literal('cardmarket'),
  currency: z.literal('EUR'),
  priceDate: z.string().date(),
  lowPrice: z.number().nullable(),
  marketPrice: z.number().nullable(),
  midPrice: z.number().nullable(),
  highPrice: z.number().nullable(),
});

export const PriceHistoryPoint = PriceDailyPoint;

export const PriceTrend = z.enum(['up', 'down', 'flat']);

export const PriceStats = z.object({
  variantNumber: z.string(),
  cardmarketId: z.number().int().nullable(),
  isFoil: z.boolean(),
  currency: z.literal('EUR'),
  /** Cardmarket trend price (price guide) — headline value. */
  currentPrice: z.number().nullable(),
  baselinePrice: z.number().nullable(),
  minPrice: z.number().nullable(),
  maxPrice: z.number().nullable(),
  avgPrice: z.number().nullable(),
  /** Cheapest marketplace listing today (any language / condition). */
  listingLow: z.number().nullable(),
  changePercent: z.number().int().nullable(),
  trend: PriceTrend,
  points: z.array(PriceDailyPoint),
  days: z.number().int(),
  priceFilterLabel: z.string(),
  priceSourceNote: z.string(),
  targetPriceCents: z.number().int().nullable().optional(),
  belowTarget: z.boolean().optional(),
});

export const PricesListQuery = z.object({
  cardmarketId: z.coerce.number().int().optional(),
  variantNumber: z.string().optional(),
  isFoil: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
});

export const PriceHistoryQuery = z.object({
  cardmarketId: z.coerce.number().int().optional(),
  variantNumber: z.string().optional(),
  isFoil: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  days: z.coerce.number().int().positive().max(365).default(30),
});

export const PriceStatsBatchRequest = z.object({
  items: z
    .array(
      z.object({
        variantNumber: z.string().min(1),
        isFoil: z.boolean().optional(),
        targetPriceCents: z.number().int().nullable().optional(),
      })
    )
    .min(1)
    .max(200),
  days: z.coerce.number().int().positive().max(365).default(30),
});

export const PricesListResponse = z.object({
  data: z.array(PriceRow),
  meta: z.object({
    pricesCatalogHash: z.string(),
    lastSyncedAt: z.string().datetime().nullable(),
    rowCount: z.number().int(),
  }),
});

export const PriceHistoryResponse = z.object({
  data: z.array(PriceDailyPoint),
  meta: z.object({
    cardmarketId: z.number().int().nullable(),
    isFoil: z.boolean().nullable(),
    days: z.number().int(),
    rowCount: z.number().int(),
  }),
});

export const PriceStatsBatchResponse = z.object({
  data: z.array(PriceStats),
  meta: z.object({
    days: z.number().int(),
    rowCount: z.number().int(),
  }),
});

export type PriceRow = z.infer<typeof PriceRow>;
export type PriceDailyPoint = z.infer<typeof PriceDailyPoint>;
export type PriceHistoryPoint = z.infer<typeof PriceHistoryPoint>;
export type PriceTrend = z.infer<typeof PriceTrend>;
export type PriceStats = z.infer<typeof PriceStats>;
export type PriceHistoryQuery = z.infer<typeof PriceHistoryQuery>;
export type PriceStatsBatchRequest = z.infer<typeof PriceStatsBatchRequest>;
