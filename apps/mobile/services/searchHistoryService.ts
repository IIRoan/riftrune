import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardListItem, CardsListResponse } from '@riftbound/contracts';
import { normalizeCardsListResponse } from '@/utils/variants';

const SEARCH_HISTORY_KEY = 'riftbound_search_history';
const SEARCH_RESULTS_CACHE_KEY = 'riftbound_search_cache';
const MAX_HISTORY_ITEMS = 20;
const MAX_CACHED_QUERIES = 12;
const CACHE_TTL_MS = 60 * 60 * 1000;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

type CachedSearchEntry = {
  query: string;
  cachedAt: number;
  response: CardsListResponse;
};

export const MIN_SEARCH_LENGTH = 3;

export async function getSearchHistory(): Promise<SearchHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SearchHistoryItem[];
  } catch {
    return [];
  }
}

export async function addSearchHistoryItem(query: string): Promise<void> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_SEARCH_LENGTH) return;

  const history = await getSearchHistory();
  const next: SearchHistoryItem[] = [
    { query: trimmed, timestamp: Date.now() },
    ...history.filter((h) => h.query.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_HISTORY_ITEMS);

  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
}

export async function removeSearchHistoryItem(query: string): Promise<void> {
  const history = await getSearchHistory();
  const next = history.filter((h) => h.query.toLowerCase() !== query.toLowerCase());
  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
}

export async function clearSearchHistory(): Promise<void> {
  await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
}

async function readResultsCache(): Promise<CachedSearchEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SEARCH_RESULTS_CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CachedSearchEntry[];
  } catch {
    return [];
  }
}

export async function getCachedSearchResults(
  query: string
): Promise<CardsListResponse | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;

  const entries = await readResultsCache();
  const hit = entries.find((e) => e.query === key);
  if (!hit) return null;
  if (Date.now() - hit.cachedAt > CACHE_TTL_MS) return null;
  return normalizeCardsListResponse(hit.response);
}

export async function cacheSearchResults(
  query: string,
  response: CardsListResponse
): Promise<void> {
  const key = query.trim().toLowerCase();
  if (key.length < MIN_SEARCH_LENGTH) return;

  const entries = (await readResultsCache()).filter((e) => e.query !== key);
  entries.unshift({
    query: key,
    cachedAt: Date.now(),
    response: normalizeCardsListResponse(response),
  });
  await AsyncStorage.setItem(
    SEARCH_RESULTS_CACHE_KEY,
    JSON.stringify(entries.slice(0, MAX_CACHED_QUERIES))
  );
}

export function filterHistoryLocally(
  history: SearchHistoryItem[],
  partial: string
): SearchHistoryItem[] {
  const q = partial.trim().toLowerCase();
  if (!q) return history;
  return history.filter((h) => h.query.toLowerCase().includes(q));
}

export type { CardListItem };
