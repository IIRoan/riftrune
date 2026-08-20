import { describe, expect, test } from 'bun:test';
import type { StoredDeckPayload } from '@riftbound/contracts';
import {
  DeckReadOnlyError,
  DeckService,
  deckPayloadForPersist,
} from '../../src/services/deck-service.js';
import type { Database } from '../../src/db/client.js';

function ownedPayload(
  id: string,
  name: string,
  extras?: Partial<StoredDeckPayload>
): StoredDeckPayload {
  const now = Date.now();
  return {
    id,
    name,
    description: '',
    createdAt: now,
    updatedAt: now,
    legend: null,
    champion: null,
    mainDeck: [],
    runes: [],
    battlefields: [],
    sideboard: [],
    ...extras,
  };
}

function createListMockDb(payloads: StoredDeckPayload[]): Database {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => payloads.map((payload) => ({ payload })),
        }),
      }),
    }),
    query: {
      userDecks: {
        findFirst: async () => null,
      },
    },
  } as unknown as Database;
}

describe('DeckReadOnlyError', () => {
  test('has stable name and message for imported deck guards', () => {
    const error = new DeckReadOnlyError();
    expect(error.name).toBe('DeckReadOnlyError');
    expect(error.message).toBe('Imported Piltover Archive decks are read-only');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('DeckService.listForUser', () => {
  test('filters owned decks by name, description, legend, and champion', async () => {
    const service = new DeckService(
      createListMockDb([
        ownedPayload('deck_a', 'Jinx Aggro', {
          legend: { variantNumber: 'OGN-001', name: 'Jinx Rebel', quantity: 1 },
        }),
        ownedPayload('deck_b', 'Control', {
          champion: { variantNumber: 'OGN-010', name: 'Viktor Herald', quantity: 1 },
        }),
        ownedPayload('deck_c', 'Burn', { description: 'fast jinx list' }),
      ])
    );

    const byLegend = await service.listForUser('user-1', {
      q: 'jinx',
      source: 'owned',
    });
    expect(byLegend.items.map((deck) => deck.id).sort()).toEqual(['deck_a', 'deck_c']);

    const byChampion = await service.listForUser('user-1', {
      q: 'viktor',
      source: 'owned',
    });
    expect(byChampion.items.map((deck) => deck.id)).toEqual(['deck_b']);

    const emptyQuery = await service.listForUser('user-1', {
      q: '   ',
      source: 'owned',
    });
    expect(emptyQuery.items).toHaveLength(3);
  });

  test('marks owned decks as editable', async () => {
    const service = new DeckService(
      createListMockDb([ownedPayload('deck_owned', 'Mine')])
    );
    const result = await service.listForUser('user-1', { source: 'owned' });
    expect(result.items[0]).toMatchObject({
      id: 'deck_owned',
      source: 'owned',
      readOnly: false,
    });
  });

  test('returns empty imported section when upstream client is unavailable', async () => {
    const service = new DeckService(
      createListMockDb([ownedPayload('deck_owned', 'Mine')])
    );
    const result = await service.listForUser('user-1', { source: 'all' });
    expect(result.owned).toBe(1);
    expect(result.imported).toBe(0);
    expect(result.pagination).toBeUndefined();
  });
});

describe('deckPayloadForPersist', () => {
  test('drops client-supplied upstreamId on new decks', () => {
    const incoming = ownedPayload('attacker-id', 'Hijack', {
      upstreamId: 'pa-community-deck',
    });
    const persisted = deckPayloadForPersist(incoming, null);
    expect(persisted.upstreamId).toBeUndefined();
    expect(persisted.id).toBe('attacker-id');
  });

  test('keeps the stored upstreamId and ignores a client replacement', () => {
    const stored = ownedPayload('deck_owned', 'Mine', { upstreamId: 'pa-owned-123' });
    const incoming = ownedPayload('deck_owned', 'Mine', {
      upstreamId: 'pa-someone-else',
    });
    const persisted = deckPayloadForPersist(incoming, stored);
    expect(persisted.upstreamId).toBe('pa-owned-123');
  });

  test('drops client-supplied importedFromId', () => {
    const incoming = ownedPayload('deck_owned', 'Mine', {
      importedFromId: 'pa-community',
    });
    const persisted = deckPayloadForPersist(incoming, null);
    expect(persisted.importedFromId).toBeUndefined();
  });

  test('keeps trusted import provenance', () => {
    const incoming = ownedPayload('deck_copy', 'Copy', {
      upstreamId: 'pa-community',
      importedFromId: 'pa-community',
    });
    const persisted = deckPayloadForPersist(incoming, null, {
      trustIncomingProvenance: true,
    });
    expect(persisted.upstreamId).toBe('pa-community');
    expect(persisted.importedFromId).toBe('pa-community');
  });
});
