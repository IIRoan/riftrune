import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardListItem } from '@riftbound/contracts';
import { api } from '@/src/api/client';
import { normalizeCardListItems } from '@/utils/variants';

const CATALOG_INDEX_KEY = 'riftbound_catalog_index';

type PersistedCatalogIndex = {
  catalogHash: string;
  pricesCatalogHash: string;
  cachedAt: number;
  items: CardListItem[];
};

export type CatalogIndexCacheKey = {
  catalogHash: string;
  pricesCatalogHash: string;
};

export function catalogIndexCacheMatches(
  persisted: CatalogIndexCacheKey | null | undefined,
  expected: CatalogIndexCacheKey
): boolean {
  if (!persisted) return false;
  return (
    persisted.catalogHash === expected.catalogHash &&
    persisted.pricesCatalogHash === expected.pricesCatalogHash
  );
}

let memoryIndex: PersistedCatalogIndex | null = null;
let memoryLoadPromise: Promise<PersistedCatalogIndex | null> | null = null;

export async function readPersistedCatalogIndex(): Promise<PersistedCatalogIndex | null> {
  if (memoryIndex) return memoryIndex;
  if (memoryLoadPromise) return memoryLoadPromise;

  memoryLoadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(CATALOG_INDEX_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedCatalogIndex;
      if (!Array.isArray(parsed.items) || parsed.items.length === 0) return null;
      memoryIndex = {
        ...parsed,
        pricesCatalogHash: parsed.pricesCatalogHash ?? '',
        items: normalizeCardListItems(parsed.items),
      };
      return memoryIndex;
    } catch {
      return null;
    } finally {
      memoryLoadPromise = null;
    }
  })();

  return memoryLoadPromise;
}

export async function persistCatalogIndex(
  catalogHash: string,
  pricesCatalogHash: string,
  items: CardListItem[]
): Promise<void> {
  const normalized = normalizeCardListItems(items);
  const payload: PersistedCatalogIndex = {
    catalogHash,
    pricesCatalogHash,
    cachedAt: Date.now(),
    items: normalized,
  };
  memoryIndex = payload;
  try {
    await AsyncStorage.setItem(CATALOG_INDEX_KEY, JSON.stringify(payload));
  } catch {
    // Keep in-memory index even if disk write fails.
  }
}

export async function clearPersistedCatalogIndex(): Promise<void> {
  memoryIndex = null;
  try {
    await AsyncStorage.removeItem(CATALOG_INDEX_KEY);
  } catch {
    // Ignore.
  }
}

export async function fetchAndPersistCatalogIndex(
  expected: CatalogIndexCacheKey
): Promise<PersistedCatalogIndex> {
  const persisted = await readPersistedCatalogIndex();
  if (persisted && catalogIndexCacheMatches(persisted, expected)) {
    return persisted;
  }

  const hashesUnavailable = !expected.catalogHash && !expected.pricesCatalogHash;
  if (persisted && hashesUnavailable) {
    return persisted;
  }

  const response = await api.getCatalogIndex();
  const items = normalizeCardListItems(response.data);
  await persistCatalogIndex(
    response.meta.catalogHash,
    response.meta.pricesCatalogHash,
    items
  );
  return {
    catalogHash: response.meta.catalogHash,
    pricesCatalogHash: response.meta.pricesCatalogHash,
    cachedAt: Date.now(),
    items,
  };
}

export function getInMemoryCatalogIndex(): PersistedCatalogIndex | null {
  return memoryIndex;
}

/** Merge newly discovered list items into the in-memory / persisted catalog index. */
export async function mergeCatalogIndexItems(items: CardListItem[]): Promise<number> {
  if (items.length === 0) return 0;

  const current =
    memoryIndex ??
    (await readPersistedCatalogIndex()) ??
    null;
  if (!current) return 0;

  const byVariant = new Map(
    current.items.map((item) => [item.variantNumber.toLowerCase(), item] as const)
  );
  let added = 0;
  for (const item of normalizeCardListItems(items)) {
    const key = item.variantNumber.toLowerCase();
    if (!byVariant.has(key)) {
      byVariant.set(key, item);
      added += 1;
    }
  }

  if (added === 0) return 0;

  await persistCatalogIndex(
    current.catalogHash,
    current.pricesCatalogHash,
    [...byVariant.values()]
  );
  return added;
}

/** Resolve cache validity and download the catalog index only when stale. */
export async function syncCatalogIndex(
  resolveCacheKey: () => Promise<CatalogIndexCacheKey>
): Promise<PersistedCatalogIndex> {
  const [persisted, cacheKey] = await Promise.all([
    readPersistedCatalogIndex(),
    resolveCacheKey(),
  ]);

  if (persisted && catalogIndexCacheMatches(persisted, cacheKey)) {
    return persisted;
  }

  return fetchAndPersistCatalogIndex(cacheKey);
}
