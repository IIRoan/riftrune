import { describe, expect, test } from 'bun:test';
import {
  CollectionAuditAction,
  CollectionAuditEvent,
  CollectionAuditListQuery,
  CollectionAuditListResponse,
} from './collection-audit.js';

describe('CollectionAuditAction', () => {
  test('accepts known mutation actions', () => {
    expect(CollectionAuditAction.parse('add')).toBe('add');
    expect(CollectionAuditAction.parse('share_merge')).toBe('share_merge');
  });
});

describe('CollectionAuditListQuery', () => {
  test('coerces limit and mine flags', () => {
    expect(CollectionAuditListQuery.parse({ limit: '25', mine: '1' })).toEqual({
      limit: 25,
      mine: true,
    });
    expect(CollectionAuditListQuery.parse({ mine: 'false' }).mine).toBe(false);
  });
});

describe('CollectionAuditEvent', () => {
  test('parses a full stack change event', () => {
    const event = CollectionAuditEvent.parse({
      id: '11111111-1111-4111-8111-111111111111',
      collectionId: '22222222-2222-4222-8222-222222222222',
      action: 'add',
      variantNumber: 'VEN-152',
      condition: 'near_mint',
      language: 'en',
      isFoil: true,
      quantityBefore: 0,
      quantityAfter: 1,
      quantityDelta: 1,
      metadata: null,
      createdAt: '2026-08-11T08:11:50.323Z',
      actor: {
        userId: 'user_1',
        name: 'roan',
        email: 'personal@roan.zip',
      },
    });
    expect(event.quantityDelta).toBe(1);
    expect(event.actor.email).toBe('personal@roan.zip');
  });
});

describe('CollectionAuditListResponse', () => {
  test('wraps events with pagination meta', () => {
    const parsed = CollectionAuditListResponse.parse({
      data: [],
      meta: { total: 0, limit: 50, hasMore: false },
    });
    expect(parsed.meta.hasMore).toBe(false);
  });
});
