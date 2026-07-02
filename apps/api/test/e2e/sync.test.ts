import { describe, expect, test } from 'bun:test';
import { apiJson, getEnv } from './support.js';

describe('upstream sync (live Riftrune API)', () => {
  test('POST /v1/sync/catalog ingests cards into Postgres cache', async () => {
    const token = getEnv().ADMIN_SYNC_TOKEN;

    const result = await apiJson<{
      data: { changed: boolean; variantCount: number; hash: string };
    }>('/v1/sync/catalog', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(result.data.variantCount).toBeGreaterThan(10);
    expect(result.data.hash.length).toBeGreaterThan(0);

    const after = await apiJson<{
      data: { catalog: { variantCount: number; hash: string } };
    }>('/v1/sync/status');

    expect(after.data.catalog.variantCount).toBe(result.data.variantCount);
  }, 300_000);

  test('POST /v1/sync/prices ingests Cardmarket EUR rows', async () => {
    const token = getEnv().ADMIN_SYNC_TOKEN;
    const result = await apiJson<{
      data: { changed: boolean; rowCount: number; hash: string };
    }>('/v1/sync/prices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(result.data.rowCount).toBeGreaterThan(1000);
    expect(result.data.hash.length).toBeGreaterThan(0);

    const status = await apiJson<{
      data: { prices: { rowCount: number } };
    }>('/v1/sync/status');

    expect(status.data.prices.rowCount).toBe(result.data.rowCount);
  }, 300_000);

  test('repeated catalog sync is idempotent (fingerprint skip or stable hash)', async () => {
    const token = getEnv().ADMIN_SYNC_TOKEN;
    const first = await apiJson<{ data: { changed: boolean; hash: string } }>(
      '/v1/sync/catalog',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const second = await apiJson<{ data: { changed: boolean; hash: string } }>(
      '/v1/sync/catalog',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    expect(second.data.hash).toBe(first.data.hash);
    expect(second.data.changed).toBe(false);
  }, 300_000);
});
