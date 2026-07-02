import { afterAll, beforeAll, setDefaultTimeout } from 'bun:test';
import {
  teardownE2E,
  setupE2E,
  ensureCatalogSynced,
  ensurePricesSynced,
} from './support.js';

setDefaultTimeout(180_000);

beforeAll(async () => {
  await setupE2E();
  await ensureCatalogSynced();
  await ensurePricesSynced();
}, 300_000);

afterAll(async () => {
  await teardownE2E();
});
