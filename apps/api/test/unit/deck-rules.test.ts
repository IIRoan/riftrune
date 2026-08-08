import { describe, expect, test } from 'bun:test';
import { createApp } from '../../src/app.js';
import { loadEnv } from '../../src/env.js';

function deckCard(overrides?: Record<string, unknown>) {
  return {
    cardId: 'card-legend',
    variantNumber: 'OGN-001',
    name: 'Jinx Rebel',
    type: 'Unit',
    super: 'Champion',
    tags: ['Jinx'],
    colors: ['Mind', 'Chaos'],
    energy: 0,
    setCode: 'OGN',
    rarity: 'Rare',
    variantType: 'Standard',
    isSignature: false,
    ...overrides,
  };
}

function deckEntry(card: ReturnType<typeof deckCard>, count = 1) {
  return { card, count };
}

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

  test('POST /api/v1/deck-rules/validate accepts a minimal legal shell', async () => {
    const legend = deckCard({ cardId: 'legend-1', variantNumber: 'OGN-001' });
    const champion = deckCard({ cardId: 'champion-1', variantNumber: 'OGN-002' });
    const mainCard = deckCard({ cardId: 'main-1', variantNumber: 'OGN-010', super: null, tags: [] });

    const response = await app.handle(
      new Request('http://localhost/api/v1/deck-rules/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'constructed',
          legend,
          champion,
          mainDeck: Array.from({ length: 39 }, () => deckEntry(mainCard)),
          runes: Array.from({ length: 12 }, (_, index) =>
            deckEntry(
              deckCard({
                cardId: `rune-${String(index)}`,
                variantNumber: `RUN-${String(index + 1).padStart(3, '0')}`,
                type: 'Rune',
                super: null,
                tags: [],
                colors: ['Mind'],
              })
            )
          ),
          battlefields: [
            deckEntry(deckCard({ cardId: 'bf-1', variantNumber: 'BF-001', type: 'Battlefield' })),
            deckEntry(deckCard({ cardId: 'bf-2', variantNumber: 'BF-002', type: 'Battlefield' })),
            deckEntry(deckCard({ cardId: 'bf-3', variantNumber: 'BF-003', type: 'Battlefield' })),
          ],
          sideboard: [],
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.valid).toBe(true);
    expect(body.data.hasErrors).toBe(false);
  });

  test('POST /api/v1/deck-rules/validate reports wrong section counts', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/deck-rules/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legend: deckCard({ cardId: 'legend-1' }),
          champion: deckCard({ cardId: 'champion-1', variantNumber: 'OGN-002' }),
          mainDeck: [],
          runes: [],
          battlefields: [],
          sideboard: [],
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.valid).toBe(false);
    expect(
      body.data.messages.some((m: { code: string }) =>
        ['main_deck_count', 'rune_count', 'battlefield_count'].includes(m.code)
      )
    ).toBe(true);
  });
});
