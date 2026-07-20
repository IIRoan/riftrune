import { describe, expect, test } from 'bun:test';
import { resolveCorsOrigins, resolveTrustedOrigins } from '../../src/lib/trusted-origins.js';
import type { Env } from '../../src/env.js';

function baseEnv(overrides: Partial<Env> = {}): Env {
  return {
    NODE_ENV: 'production',
    PORT: 7000,
    DATABASE_URL: 'postgres://riftbound:riftbound@localhost:5433/riftbound',
    RIFTRUNE_API_KEY: 'ak_test_key_1234567890',
    RIFTRUNE_BASE_URL: 'https://piltoverarchive.com/api/external',
    ADMIN_SYNC_TOKEN: 'sync-token-12345678',
    SYNC_CRON_ENABLED: true,
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://api.riftrune.com',
    TRUSTED_ORIGINS: ['https://riftrune.com'],
    SWAGGER_ENABLED: false,
    CATALOG_WARMUP_ON_START: false,
    CARDMARKET_GAME_ID: 22,
    DB_POOL_MAX: 5,
    ...overrides,
  };
}

describe('resolveTrustedOrigins', () => {
  test('includes app scheme, configured origins, and auth base URL', () => {
    const origins = resolveTrustedOrigins(baseEnv());
    expect(origins).toContain('riftrune://');
    expect(origins).toContain('https://riftrune.com');
    expect(origins).toContain('https://api.riftrune.com');
  });

  test('adds Expo dev origins in development', () => {
    const origins = resolveTrustedOrigins(baseEnv({ NODE_ENV: 'development' }));
    expect(origins).toContain('exp://');
    expect(origins).toContain('http://localhost:7001');
  });
});

describe('resolveCorsOrigins', () => {
  test('allows all origins in development', () => {
    expect(resolveCorsOrigins(baseEnv({ NODE_ENV: 'development' }))).toBe(true);
  });

  test('returns browser origins in production', () => {
    expect(resolveCorsOrigins(baseEnv())).toEqual([
      'https://riftrune.com',
      'https://api.riftrune.com',
    ]);
  });
});
