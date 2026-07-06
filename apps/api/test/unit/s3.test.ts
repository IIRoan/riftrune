import { describe, expect, test } from 'bun:test';
import {
  apiImageUrl,
  contentTypeForKey,
  objectKeyFromUrl,
  rewriteImageUrl,
} from '../../src/lib/s3.js';
import type { Env } from '../../src/env.js';

const s3Env: Env = {
  NODE_ENV: 'test',
  PORT: 7000,
  DATABASE_URL: 'postgres://localhost/db',
  RIFTRUNE_API_KEY: 'ak_test',
  RIFTRUNE_BASE_URL: 'https://piltoverarchive.com/api/external',
  ADMIN_SYNC_TOKEN: 'dev-sync-token-change-me',
  SYNC_CRON_ENABLED: false,
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:7000',
  TRUSTED_ORIGINS: [],
  SWAGGER_ENABLED: false,
  CATALOG_WARMUP_ON_START: false,
  DB_POOL_MAX: 5,
  S3_ENDPOINT: 'https://account.eu.r2.cloudflarestorage.com',
  S3_REGION: 'auto',
  S3_BUCKET: 'riftbound',
  S3_ACCESS_KEY_ID: 'test-key',
  S3_SECRET_ACCESS_KEY: 'test-secret',
};

describe('s3 helpers', () => {
  test('objectKeyFromUrl extracts path from CDN URL', () => {
    expect(
      objectKeyFromUrl('https://cdn.piltoverarchive.com/cards/UNL-099.webp')
    ).toBe('cards/UNL-099.webp');
  });

  test('rewriteImageUrl maps CDN URL to API route', () => {
    expect(
      rewriteImageUrl(
        s3Env,
        'https://cdn.piltoverarchive.com/cards/SFD-198.webp'
      )
    ).toBe('http://localhost:7000/api/v1/images/cards/SFD-198.webp');
  });

  test('contentTypeForKey maps webp extension', () => {
    expect(contentTypeForKey('cards/UNL-099.webp')).toBe('image/webp');
  });
});
