import { describe, expect, test } from 'bun:test';
import { CollectionLiveEvent } from '@riftbound/contracts';

describe('CollectionLiveEvent', () => {
  test('accepts changed, ready, and heartbeat payloads', () => {
    expect(
      CollectionLiveEvent.parse({
        type: 'collection.changed',
        collectionId: '11111111-1111-1111-1111-111111111111',
        reason: 'add',
        actorUserId: 'user-1',
        at: '2026-07-31T12:00:00.000Z',
      }).type
    ).toBe('collection.changed');

    expect(
      CollectionLiveEvent.parse({
        type: 'ready',
        collectionId: '11111111-1111-1111-1111-111111111111',
      }).type
    ).toBe('ready');

    expect(
      CollectionLiveEvent.parse({
        type: 'heartbeat',
        at: '2026-07-31T12:00:00.000Z',
      }).type
    ).toBe('heartbeat');
  });
});
