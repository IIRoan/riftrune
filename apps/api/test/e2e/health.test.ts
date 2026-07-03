import { describe, expect, test } from 'bun:test';
import { HealthResponse, SyncStatusResponse } from '@riftbound/contracts';
import { apiJson } from './support.js';

describe('health', () => {
  test('GET /api/v1/health returns ok with database connected', async () => {
    const json = await apiJson<unknown>('/api/v1/health');
    const parsed = HealthResponse.parse(json);

    expect(parsed.data.status).toBe('ok');
    expect(parsed.data.db).toBe('ok');
  });
});

describe('sync status', () => {
  test('GET /api/v1/sync/status returns catalog and prices metadata', async () => {
    const json = await apiJson<unknown>('/api/v1/sync/status');
    const parsed = SyncStatusResponse.parse(json);

    expect(parsed.data.catalog.status).toMatch(/^(idle|running|failed)$/);
    expect(parsed.data.prices.status).toMatch(/^(idle|running|failed)$/);
  });
});
