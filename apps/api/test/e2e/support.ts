import { join } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createApp, type AppContext } from '../../src/app.js';
import { loadEnv, type Env } from '../../src/env.js';

const E2E_PORT = Number(process.env.E2E_PORT ?? 3099);

let ctx: AppContext | null = null;
let ownsServer = false;
let baseUrl = '';

export function getBaseUrl(): string {
  if (!baseUrl) {
    throw new Error('E2E setup has not run yet');
  }
  return baseUrl;
}

export function getEnv(): Env {
  return loadEnv();
}

export function getContext(): AppContext {
  if (!ctx) {
    throw new Error('E2E setup has not run yet');
  }
  return ctx;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${getBaseUrl()}${path}`, init);
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const body = await res.text();
  if (!res.ok) {
    throw new Error(
      `E2E ${init?.method ?? 'GET'} ${path} → ${String(res.status)}: ${body}`
    );
  }
  return JSON.parse(body) as T;
}

async function runMigrations(databaseUrl: string): Promise<void> {
  const migrationClient = postgres(databaseUrl, { max: 1 });
  const migrationDb = drizzle(migrationClient);
  const migrationsFolder = join(import.meta.dir, '../../drizzle');
  await migrate(migrationDb, { migrationsFolder });
  await migrationClient.end({ timeout: 5 });
}

export async function setupE2E(): Promise<void> {
  if (baseUrl) return;

  process.env.NODE_ENV ??= 'test';
  process.env.SYNC_CRON_ENABLED = 'false';
  process.env.SYNC_MAX_PAGES ??= '2';

  const env = loadEnv();
  await runMigrations(env.DATABASE_URL);

  const externalUrl = process.env.E2E_API_URL;
  if (externalUrl) {
    baseUrl = externalUrl.replace(/\/$/, '');
    const health = await fetch(`${baseUrl}/v1/health`);
    if (!health.ok) {
      throw new Error(`E2E_API_URL is not reachable: ${baseUrl}`);
    }
    return;
  }

  ctx = createApp(env);
  ctx.app.listen(E2E_PORT);
  ownsServer = true;
  baseUrl = `http://localhost:${String(E2E_PORT)}`;

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/v1/health`);
      if (res.ok) break;
    } catch {
      // retry
    }
    await Bun.sleep(200);
  }
}

export async function teardownE2E(): Promise<void> {
  if (ownsServer && ctx) {
    await ctx.client.end({ timeout: 5 });
    ctx = null;
    ownsServer = false;
  }
}

export async function ensureCatalogSynced(): Promise<void> {
  const status = await apiJson<{
    data: { catalog: { variantCount: number; lastRun: string | null } };
  }>('/v1/sync/status');

  if (status.data.catalog.variantCount > 10) return;

  const token = getEnv().ADMIN_SYNC_TOKEN;
  await apiJson('/v1/sync/catalog', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function ensurePricesSynced(): Promise<void> {
  const status = await apiJson<{
    data: { prices: { rowCount: number } };
  }>('/v1/sync/status');

  if (status.data.prices.rowCount > 0) return;

  const token = getEnv().ADMIN_SYNC_TOKEN;
  await apiJson('/v1/sync/prices', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
