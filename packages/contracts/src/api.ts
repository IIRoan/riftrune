import { z } from 'zod';

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

export type HealthResponse = z.infer<typeof HealthResponse>;
export type SyncStatusResponse = z.infer<typeof SyncStatusResponse>;
