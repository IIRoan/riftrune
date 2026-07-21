import { describe, expect, mock, test } from 'bun:test';
import {
  API_WAKE_RETRY_DELAY_MS,
  fetchWithApiWake,
  isApiWakeNetworkError,
  isApiWakeStatus,
} from './api-fetch';

describe('isApiWakeStatus', () => {
  test('treats gateway / timeout statuses as wake failures', () => {
    expect(isApiWakeStatus(502)).toBe(true);
    expect(isApiWakeStatus(503)).toBe(true);
    expect(isApiWakeStatus(504)).toBe(true);
    expect(isApiWakeStatus(401)).toBe(false);
    expect(isApiWakeStatus(404)).toBe(false);
  });
});

describe('isApiWakeNetworkError', () => {
  test('detects common RN / browser network failures', () => {
    expect(isApiWakeNetworkError(new TypeError('Network request failed'))).toBe(true);
    expect(isApiWakeNetworkError(new Error('Failed to fetch'))).toBe(true);
    expect(isApiWakeNetworkError(new Error('validation failed'))).toBe(false);
  });
});

describe('fetchWithApiWake', () => {
  test('returns the first successful response', async () => {
    const fetchMock = mock(async () => new Response('ok', { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;

    const res = await fetchWithApiWake('https://riftapi.solace.onl/api/v1/health');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('retries once after a gateway wake status', async () => {
    const fetchMock = mock(async () => {
      if (fetchMock.mock.calls.length === 1) {
        return new Response('starting', { status: 503 });
      }
      return new Response('{"ok":true}', { status: 200 });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const started = Date.now();
    const res = await fetchWithApiWake('https://riftapi.solace.onl/api/v1/health');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(Date.now() - started).toBeGreaterThanOrEqual(API_WAKE_RETRY_DELAY_MS - 50);
  });

  test('retries once after a network error then succeeds', async () => {
    const fetchMock = mock(async () => {
      if (fetchMock.mock.calls.length === 1) {
        throw new TypeError('Network request failed');
      }
      return new Response('ok', { status: 200 });
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const res = await fetchWithApiWake('https://riftapi.solace.onl/api/v1/health');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('does not retry client errors like 401', async () => {
    const fetchMock = mock(async () => new Response('nope', { status: 401 }));
    globalThis.fetch = fetchMock as typeof fetch;

    const res = await fetchWithApiWake('https://riftapi.solace.onl/api/v1/collection');
    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
