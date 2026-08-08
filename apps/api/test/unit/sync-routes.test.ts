import { describe, expect, test } from 'bun:test';
import { createApp } from '../../src/app.js';
import { loadEnv } from '../../src/env.js';

describe('sync admin routes', () => {
  const env = loadEnv();
  const { app } = createApp(env);

  async function postSync(path: string, headers?: HeadersInit) {
    return app.handle(
      new Request(`http://localhost${path}`, {
        method: 'POST',
        headers,
      })
    );
  }

  test('POST /api/v1/sync/catalog rejects missing bearer token', async () => {
    const response = await postSync('/api/v1/sync/catalog');
    expect(response.status).toBe(500);
    const body = (await response.json()) as { detail: string };
    expect(body.detail).toBe('Unauthorized');
  });

  test('POST /api/v1/sync/catalog rejects invalid bearer token', async () => {
    const response = await postSync('/api/v1/sync/catalog', {
      Authorization: 'Bearer wrong-token',
    });
    expect(response.status).toBe(500);
    const body = (await response.json()) as { detail: string };
    expect(body.detail).toBe('Unauthorized');
  });

  test('POST /api/v1/sync/prices rejects missing bearer token', async () => {
    const response = await postSync('/api/v1/sync/prices');
    expect(response.status).toBe(500);
    const body = (await response.json()) as { detail: string };
    expect(body.detail).toBe('Unauthorized');
  });

  test('GET /api/v1/sync/status is public', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/sync/status'));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { catalog: unknown; prices: unknown } };
    expect(body.data).toHaveProperty('catalog');
    expect(body.data).toHaveProperty('prices');
  });
});
