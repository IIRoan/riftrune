import AsyncStorage from '@react-native-async-storage/async-storage';
import { deserializeDeck, serializeDeck } from '@/lib/deck-card';
import type { DeckState, SerializedDeck } from '@/lib/deck-types';

const OWNED_DECKS_CACHE_KEY = 'riftbound_owned_decks_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type PersistedOwnedDecks = {
  cachedAt: number;
  decks: SerializedDeck[];
};

export async function readPersistedOwnedDecks(): Promise<DeckState[] | null> {
  try {
    const raw = await AsyncStorage.getItem(OWNED_DECKS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedOwnedDecks;
    if (!Array.isArray(parsed.decks)) return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(OWNED_DECKS_CACHE_KEY);
      return null;
    }
    return parsed.decks.map(deserializeDeck);
  } catch {
    return null;
  }
}

export async function persistOwnedDecks(decks: DeckState[]): Promise<void> {
  try {
    const payload: PersistedOwnedDecks = {
      cachedAt: Date.now(),
      decks: decks.map(serializeDeck),
    };
    await AsyncStorage.setItem(OWNED_DECKS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Best-effort cache; ignore write failures.
  }
}

export async function clearPersistedOwnedDecks(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OWNED_DECKS_CACHE_KEY);
  } catch {
    // Ignore.
  }
}
