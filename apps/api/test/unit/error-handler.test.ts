import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { errorPlugin } from '../../src/plugins/error-handler.js';

function createApp() {
  return errorPlugin
    .get('/unauthorized', () => {
      throw new Error('Unauthorized');
    })
    .get('/missing', () => {
      throw new Error('Card not found');
    })
    .get('/boom', () => {
      throw new Error('database exploded');
    });
}

describe('errorPlugin', () => {
  test('maps Unauthorized to 401', async () => {
    const res = await createApp().handle(new Request('http://localhost/unauthorized'));
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('UNAUTHORIZED');
  });

  test('maps not-found messages to 404', async () => {
    const res = await createApp().handle(new Request('http://localhost/missing'));
    expect(res.status).toBe(404);
  });

  test('maps unknown failures to 500', async () => {
    const res = await createApp().handle(new Request('http://localhost/boom'));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).toBe('database exploded');
  });
});
