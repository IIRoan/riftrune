import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardListItem } from '@riftbound/contracts';
import { api } from '@/src/api/client';
import { normalizeCardListItems } from '@/utils/variants';

const CATALOG_INDEX_KEY = 'riftbound_catalog_index';

type PersistedCatalogIndex = {
  catalogHash: string;
  cachedAt: number;
  items: CardListItem[];
};

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
  items: CardListItem[]
): Promise<void> {
  const normalized = normalizeCardListItems(items);
  const payload: PersistedCatalogIndex = {
    catalogHash,
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
  expectedCatalogHash?: string | null
): Promise<PersistedCatalogIndex> {
  const persisted = await readPersistedCatalogIndex();
  if (
    persisted &&
    expectedCatalogHash &&
    persisted.catalogHash === expectedCatalogHash
  ) {
    return persisted;
  }

  const response = await api.getCatalogIndex();
  const items = normalizeCardListItems(response.data);
  await persistCatalogIndex(response.meta.catalogHash, items);
  return {
    catalogHash: response.meta.catalogHash,
    cachedAt: Date.now(),
    items,
  };
}

export function getInMemoryCatalogIndex(): PersistedCatalogIndex | null {
  return memoryIndex;
}
