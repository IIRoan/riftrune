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

export const PricesListQuery = z.object({
  cardmarketId: z.coerce.number().int().optional(),
  variantNumber: z.string().optional(),
  isFoil: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
});

export const PricesListResponse = z.object({
  data: z.array(PriceRow),
  meta: z.object({
    pricesCatalogHash: z.string(),
    lastSyncedAt: z.string().datetime().nullable(),
    rowCount: z.number().int(),
  }),
});

export type PriceRow = z.infer<typeof PriceRow>;
