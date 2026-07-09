import { afterAll, beforeAll, describe, expect, test, setDefaultTimeout } from 'bun:test';
import {
  CardsListResponse,
  CatalogIndexResponse,
  CollectionListResponse,
  CollectionQuantitiesResponse,
  FiltersResponse,
  HealthResponse,
} from '@riftbound/contracts';
import { authFetch, cleanupTestUsers, signUpTestUser } from './helpers/auth.js';
import { assertMaxMs, readBudget, timedJson } from './helpers/timing.js';

setDefaultTimeout(180_000);

const BUDGET = {
  health: readBudget('health', 150),
  filters: readBudget('filters', 250),
  search: readBudget('search', 800),
  index: readBudget('index', 5000),
  detail: readBudget('detail', 500),
  quantities: readBudget('quantities', 400),
  collectionList: readBudget('collection_list', 2500),
};

const testEmail = `test-perf-${Date.now()}@test.riftbound.dev`;
const testPassword = 'test-password-12345';
let cookieHeader = '';
let sampleVariant = '';
let sampleVariants: string[] = [];

beforeAll(async () => {
  await cleanupTestUsers('test-perf-%');
  cookieHeader = await signUpTestUser({
    email: testEmail,
    password: testPassword,
    name: 'Performance User',
  });

  const search = CardsListResponse.parse(
    (
      await timedJson<unknown>('seed search', () =>
        authFetch('/api/v1/cards?q=vi&limit=20&page=1')
      )
    ).data
  );
  sampleVariant = search.data[0]?.variantNumber ?? '';
  sampleVariants = search.data.slice(0, 20).map((card) => card.variantNumber);
  expect(sampleVariant).toBeTruthy();
  expect(sampleVariants.length).toBeGreaterThan(0);

  await authFetch(`/api/v1/collection/${encodeURIComponent(sampleVariant)}/add`, {
    method: 'POST',
    cookie: cookieHeader,
    body: JSON.stringify({ delta: 2 }),
  });
});

afterAll(async () => {
  await cleanupTestUsers('test-perf-%');
});

describe('API response times (cached catalog)', () => {
  test(`GET /api/v1/health ≤ ${String(BUDGET.health)}ms`, async () => {
    const { ms, data } = await timedJson<unknown>('health', () => authFetch('/api/v1/health'));
    HealthResponse.parse(data);
    assertMaxMs('health', ms, BUDGET.health);
  });

  test(`GET /api/v1/filters ≤ ${String(BUDGET.filters)}ms`, async () => {
    const { ms, data } = await timedJson<unknown>('filters', () => authFetch('/api/v1/filters'));
    FiltersResponse.parse(data);
    assertMaxMs('filters', ms, BUDGET.filters);
  });

  test(`GET /api/v1/cards search ≤ ${String(BUDGET.search)}ms`, async () => {
    const { ms, data } = await timedJson<unknown>('search', () =>
      authFetch('/api/v1/cards?q=vi&limit=40&page=1&sortBy=name&dir=asc')
    );
    const parsed = CardsListResponse.parse(data);
    expect(parsed.data.length).toBeGreaterThan(0);
    assertMaxMs('search', ms, BUDGET.search);
  });

  test(`GET /api/v1/cards/index ≤ ${String(BUDGET.index)}ms`, async () => {
    const { ms, data } = await timedJson<unknown>('catalog index', () =>
      authFetch('/api/v1/cards/index')
    );
    const parsed = CatalogIndexResponse.parse(data);
    expect(parsed.meta.total).toBeGreaterThan(0);
    assertMaxMs('catalog index', ms, BUDGET.index);
  });

  test(`GET /api/v1/cards/:variantNumber ≤ ${String(BUDGET.detail)}ms`, async () => {
    const { ms, data } = await timedJson<unknown>('card detail', () =>
      authFetch(`/api/v1/cards/${encodeURIComponent(sampleVariant)}`)
    );
    expect(data).toBeTruthy();
    assertMaxMs('card detail', ms, BUDGET.detail);
  });

  test(`POST /api/v1/collection/quantities ≤ ${String(BUDGET.quantities)}ms`, async () => {
    const { ms, data } = await timedJson<unknown>('collection quantities', () =>
      authFetch('/api/v1/collection/quantities', {
        method: 'POST',
        cookie: cookieHeader,
        body: JSON.stringify({ variantNumbers: sampleVariants }),
      })
    );
    const parsed = CollectionQuantitiesResponse.parse(data);
    expect(parsed.data).toHaveLength(sampleVariants.length);
    assertMaxMs('collection quantities', ms, BUDGET.quantities);
  });

  test(`GET /api/v1/collection ≤ ${String(BUDGET.collectionList)}ms`, async () => {
    const { ms, data } = await timedJson<unknown>('collection list', () =>
      authFetch('/api/v1/collection', { cookie: cookieHeader })
    );
    CollectionListResponse.parse(data);
    assertMaxMs('collection list', ms, BUDGET.collectionList);
  });

  test('collection quantities stays within budget for targeted lookups', async () => {
    const quantities = await timedJson<unknown>('quantities compare', () =>
      authFetch('/api/v1/collection/quantities', {
        method: 'POST',
        cookie: cookieHeader,
        body: JSON.stringify({ variantNumbers: sampleVariants }),
      })
    );
    const fullList = await timedJson<unknown>('collection compare', () =>
      authFetch('/api/v1/collection', { cookie: cookieHeader })
    );

    CollectionQuantitiesResponse.parse(quantities.data);
    CollectionListResponse.parse(fullList.data);
    expect(quantities.ms).toBeLessThanOrEqual(BUDGET.quantities);
    expect(quantities.ms).toBeLessThanOrEqual(fullList.ms * 1.5);
  });

  test('repeat search benefits from server cache', async () => {
    const path = '/api/v1/cards?q=vi&limit=40&page=1&sortBy=name&dir=asc';
    const cold = await timedJson<unknown>('search cold', () => authFetch(path));
    const warm = await timedJson<unknown>('search warm', () => authFetch(path));

    CardsListResponse.parse(cold.data);
    CardsListResponse.parse(warm.data);
    expect(warm.ms).toBeLessThanOrEqual(cold.ms * 1.5);
  });
});
