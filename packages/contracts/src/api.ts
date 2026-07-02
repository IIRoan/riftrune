import { z } from 'zod';

export const ApiErrorBody = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const HealthResponse = z.object({
  data: z.object({
    status: z.literal('ok'),
    db: z.enum(['ok', 'error']),
    lastCatalogSync: z.string().datetime().nullable(),
  }),
});

export const SyncStatusResponse = z.object({
  data: z.object({
    catalog: z.object({
      lastRun: z.string().datetime().nullable(),
      status: z.enum(['idle', 'running', 'failed']),
      hash: z.string(),
      variantCount: z.number().int(),
    }),
    prices: z.object({
      lastRun: z.string().datetime().nullable(),
      status: z.enum(['idle', 'running', 'failed']),
      hash: z.string(),
      rowCount: z.number().int(),
    }),
  }),
});

export type ApiErrorBody = z.infer<typeof ApiErrorBody>;
