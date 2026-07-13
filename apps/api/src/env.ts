import { z } from 'zod';

function parseCsv(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true';
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(7000),
  DATABASE_URL: z.string().min(1),
  DB_POOL_MAX: z.coerce.number().int().positive().max(50).optional(),
  RIFTRUNE_API_KEY: z.string().startsWith('ak_'),
  RIFTRUNE_BASE_URL: z
    .string()
    .url()
    .default('https://piltoverarchive.com/api/external'),
  ADMIN_SYNC_TOKEN: z.string().min(16),
  SYNC_CRON_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:7000'),

  /**
   * Piltoverarchive deck writes appear to require partner identification.
   * When set, these values are forwarded as an extra header on
   * upstream deck create/delete requests.
   */
  UPSTREAM_DECK_WRITE_EXTRA_HEADER_NAME: z.string().min(1).optional(),
  UPSTREAM_DECK_WRITE_EXTRA_HEADER_VALUE: z.string().min(1).optional(),
  /** Optional override; otherwise derived from BETTER_AUTH_URL + TRUSTED_ORIGINS in production. */
  AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  TRUSTED_ORIGINS: z
    .string()
    .optional()
    .transform((value) => parseCsv(value)),
  SWAGGER_ENABLED: z
    .string()
    .optional()
    .transform((value) => parseBooleanFlag(value, false)),
  CATALOG_WARMUP_ON_START: z
    .string()
    .optional()
    .transform((value) => parseBooleanFlag(value, false)),
  /** Cardmarket `idGame` for daily price guide export (Riftbound = 22). */
  CARDMARKET_GAME_ID: z.coerce.number().int().positive().default(22),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().min(1).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }

  const env = parsed.data;
  return {
    ...env,
    DB_POOL_MAX:
      env.DB_POOL_MAX ?? (env.NODE_ENV === 'production' ? 5 : 20),
    SWAGGER_ENABLED:
      env.SWAGGER_ENABLED || env.NODE_ENV === 'development',
    CATALOG_WARMUP_ON_START:
      env.CATALOG_WARMUP_ON_START || env.NODE_ENV === 'development',
  };
}
