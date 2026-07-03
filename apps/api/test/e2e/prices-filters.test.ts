import { describe, expect, test } from 'bun:test';
import {
  FiltersResponse,
  PriceHistoryResponse,
  PricesListResponse,
} from '@riftbound/contracts';
import { apiJson, syncPricesForE2E } from './support.js';

describe('filters', () => {
  test('GET /v1/filters returns sets, colors, rarities', async () => {
    const json = await apiJson<unknown>('/v1/filters');
    const parsed = FiltersResponse.parse(json);

    expect(parsed.data.sets.length).toBeGreaterThan(0);
    expect(parsed.data.colors.length).toBeGreaterThan(0);
    expect(parsed.data.rarities.length).toBeGreaterThan(0);
    expect(parsed.data.sets[0]?.name).toBeTruthy();
  });
});

describe('prices (Cardmarket EUR cache)', () => {
  test('GET /v1/prices returns cached rows with EUR currency', async () => {
    const json = await apiJson<unknown>('/v1/prices');
    const parsed = PricesListResponse.parse(json);

    expect(parsed.data.length).toBeGreaterThan(0);
    expect(parsed.meta.rowCount).toBeGreaterThan(0);
    expect(parsed.data[0]?.currency).toBe('EUR');
    expect(parsed.meta.lastSyncedAt).toBeTruthy();
  });

  test('GET /v1/prices?cardmarketId= filters to a single cardmarket id', async () => {
    const all = PricesListResponse.parse(await apiJson<unknown>('/v1/prices'));
    const sample = all.data.find((r) => r.cardmarketId != null);
    expect(sample?.cardmarketId).toBeTruthy();

    const json = await apiJson<unknown>(
      `/v1/prices?cardmarketId=${String(sample!.cardmarketId)}`
    );
    const parsed = PricesListResponse.parse(json);

    expect(parsed.data.length).toBeGreaterThan(0);
    expect(parsed.data.every((r) => r.cardmarketId === sample!.cardmarketId)).toBe(
      true
    );
  }, 60_000);

  test('GET /v1/prices/history returns stored snapshots for a cardmarket id', async () => {
    await syncPricesForE2E();

    const all = PricesListResponse.parse(await apiJson<unknown>('/v1/prices'));
    const sample = all.data.find((r) => r.cardmarketId != null);
    expect(sample?.cardmarketId).toBeTruthy();

    const history = PriceHistoryResponse.parse(
      await apiJson<unknown>(
        `/v1/prices/history?cardmarketId=${String(sample!.cardmarketId)}&isFoil=${String(
          sample!.isFoil
        )}&days=365`
      )
    );

    expect(history.meta.cardmarketId).toBe(sample!.cardmarketId);
    expect(history.meta.isFoil).toBe(sample!.isFoil);
    expect(history.meta.rowCount).toBeGreaterThan(0);
    expect(history.data.length).toBeGreaterThan(0);
    expect(history.data.every((row) => row.cardmarketId === sample!.cardmarketId)).toBe(
      true
    );
    expect(history.data.every((row) => row.isFoil === sample!.isFoil)).toBe(true);
    expect(history.data.at(-1)?.capturedAt).toBeTruthy();
  }, 300_000);
});
