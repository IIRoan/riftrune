import { afterAll, beforeAll, describe, expect, test, setDefaultTimeout } from 'bun:test';
import {
  CollectionItemResponse,
  CollectionListResponse,
  CollectionQuantitiesResponse,
} from '@riftbound/contracts';
import { and, eq } from 'drizzle-orm';
import { authFetch, cleanupTestUsers, signUpTestUser } from './helpers/auth.js';
import { getContext } from './support.js';
import { collectionItems, collectionMembers } from '../../src/db/schema.js';

setDefaultTimeout(120_000);

const stamp = Date.now();
const password = 'test-password-12345';
let cookie = '';
let userId = '';

const STD = 'OGN-015';
const FOIL = 'OGN-015-Foil';

beforeAll(async () => {
  await cleanupTestUsers('test-db-coll-foil-%');
  cookie = await signUpTestUser({
    email: `test-db-coll-foil-${stamp}@test.riftbound.dev`,
    password,
    name: 'Collection Foil User',
  });
  const session = await (await authFetch('/api/auth/get-session', { cookie })).json();
  userId = session.user.id as string;
});

afterAll(async () => {
  await cleanupTestUsers('test-db-coll-foil-%');
});

async function collectionIdForUser(uid: string): Promise<string> {
  const { db } = getContext();
  const [row] = await db
    .select({ collectionId: collectionMembers.collectionId })
    .from(collectionMembers)
    .where(eq(collectionMembers.userId, uid))
    .limit(1);
  if (!row) throw new Error(`No collection membership for ${uid}`);
  return row.collectionId;
}

async function quantities(variantNumbers: string[]): Promise<Map<string, number>> {
  const res = await authFetch('/api/v1/collection/quantities', {
    method: 'POST',
    cookie,
    body: JSON.stringify({ variantNumbers }),
  });
  const parsed = CollectionQuantitiesResponse.parse(await res.json());
  return new Map(parsed.data.map((row) => [row.variantNumber, row.quantity]));
}

async function dbQty(variantNumber: string): Promise<number> {
  const { db } = getContext();
  const collectionId = await collectionIdForUser(userId);
  const [row] = await db
    .select({ quantity: collectionItems.quantity })
    .from(collectionItems)
    .where(
      and(
        eq(collectionItems.collectionId, collectionId),
        eq(collectionItems.variantNumber, variantNumber),
        eq(collectionItems.condition, 'near_mint'),
        eq(collectionItems.language, 'en')
      )
    )
    .limit(1);
  return row?.quantity ?? 0;
}

describe('collection foil vs standard stack mutations', () => {
  test('adding foil does not create or increment the standard stack', async () => {
    const addFoil = await authFetch(`/api/v1/collection/${encodeURIComponent(FOIL)}/add`, {
      method: 'POST',
      cookie,
      body: JSON.stringify({ delta: 1 }),
    });
    expect(addFoil.status).toBe(200);
    const foilItem = CollectionItemResponse.parse(await addFoil.json());
    expect(foilItem.data?.variantNumber).toBe(FOIL);
    expect(foilItem.data?.quantity).toBe(1);
    expect(foilItem.data?.isFoil).toBe(true);

    const qty = await quantities([STD, FOIL]);
    expect(qty.get(FOIL)).toBe(1);
    expect(qty.get(STD)).toBe(0);
    expect(await dbQty(FOIL)).toBe(1);
    expect(await dbQty(STD)).toBe(0);
  });

  test('adding standard alongside foil keeps independent quantities', async () => {
    const addStd = await authFetch(`/api/v1/collection/${encodeURIComponent(STD)}/add`, {
      method: 'POST',
      cookie,
      body: JSON.stringify({ delta: 2 }),
    });
    expect(addStd.status).toBe(200);
    expect(CollectionItemResponse.parse(await addStd.json()).data?.isFoil).toBe(false);

    const qty = await quantities([STD, FOIL]);
    expect(qty.get(STD)).toBe(2);
    expect(qty.get(FOIL)).toBe(1);
  });

  test('removing from foil-only decrements foil and leaves standard intact', async () => {
    // Reset to foil-only: clear std then ensure foil=1
    await authFetch(`/api/v1/collection/${encodeURIComponent(STD)}`, {
      method: 'PUT',
      cookie,
      body: JSON.stringify({ variantNumber: STD, quantity: 0 }),
    });
    await authFetch(`/api/v1/collection/${encodeURIComponent(FOIL)}`, {
      method: 'PUT',
      cookie,
      body: JSON.stringify({ variantNumber: FOIL, quantity: 1 }),
    });

    const removeFoil = await authFetch(`/api/v1/collection/${encodeURIComponent(FOIL)}/remove`, {
      method: 'POST',
      cookie,
      body: JSON.stringify({ delta: 1 }),
    });
    expect(removeFoil.status).toBe(200);
    expect(await removeFoil.json()).toEqual({ data: null });

    const qty = await quantities([STD, FOIL]);
    expect(qty.get(FOIL)).toBe(0);
    expect(qty.get(STD)).toBe(0);
  });

  test('removing standard does not touch foil when both are owned', async () => {
    await authFetch(`/api/v1/collection/${encodeURIComponent(STD)}/add`, {
      method: 'POST',
      cookie,
      body: JSON.stringify({ delta: 3 }),
    });
    await authFetch(`/api/v1/collection/${encodeURIComponent(FOIL)}/add`, {
      method: 'POST',
      cookie,
      body: JSON.stringify({ delta: 2 }),
    });

    const removeStd = await authFetch(`/api/v1/collection/${encodeURIComponent(STD)}/remove`, {
      method: 'POST',
      cookie,
      body: JSON.stringify({ delta: 1 }),
    });
    expect(removeStd.status).toBe(200);
    expect(CollectionItemResponse.parse(await removeStd.json()).data?.quantity).toBe(2);

    const qty = await quantities([STD, FOIL]);
    expect(qty.get(STD)).toBe(2);
    expect(qty.get(FOIL)).toBe(2);

    const list = CollectionListResponse.parse(
      await (await authFetch('/api/v1/collection', { cookie })).json()
    );
    const stdRow = list.data.find((item) => item.variantNumber === STD);
    const foilRow = list.data.find((item) => item.variantNumber === FOIL);
    expect(stdRow?.quantity).toBe(2);
    expect(stdRow?.isFoil).toBe(false);
    expect(foilRow?.quantity).toBe(2);
    expect(foilRow?.isFoil).toBe(true);
  });

  test('DELETE foil printing leaves standard stack', async () => {
    await authFetch(`/api/v1/collection/${encodeURIComponent(FOIL)}`, {
      method: 'DELETE',
      cookie,
    });

    const qty = await quantities([STD, FOIL]);
    expect(qty.get(FOIL)).toBe(0);
    expect(qty.get(STD)).toBe(2);
  });

  test('PUT absolute quantity on foil does not alter standard', async () => {
    await authFetch(`/api/v1/collection/${encodeURIComponent(FOIL)}`, {
      method: 'PUT',
      cookie,
      body: JSON.stringify({ variantNumber: FOIL, quantity: 5 }),
    });

    const qty = await quantities([STD, FOIL]);
    expect(qty.get(FOIL)).toBe(5);
    expect(qty.get(STD)).toBe(2);
  });
});
