import { describe, expect, test } from 'bun:test';
import { createApp } from '../../src/app.js';
import { loadEnv } from '../../src/env.js';

describe('deck-rules routes', () => {
  const env = loadEnv();
  const { app } = createApp(env);

  test('GET /api/v1/deck-rules returns canonical rules', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/deck-rules'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.rules.sections.runes.target).toBe(12);
    expect(body.data.rules.sections.mainDeck.target).toBe(39);
  });

  test('POST /api/v1/deck-rules/validate reports missing legend', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/deck-rules/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legend: null,
          champion: null,
          mainDeck: [],
          runes: [],
          battlefields: [],
          sideboard: [],
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.hasErrors).toBe(true);
    expect(body.data.messages.some((m: { code: string }) => m.code === 'missing_legend')).toBe(
      true
    );
  });
});
