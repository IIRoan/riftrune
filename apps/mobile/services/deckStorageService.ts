import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createEmptyDeck,
  deserializeDeck,
  serializeDeck,
} from '@/lib/deck-card';
import type { DeckState, SerializedDeck } from '@/lib/deck-types';

const STORAGE_KEY = 'riftbound_decks_v1';

export async function loadDecks(): Promise<DeckState[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as SerializedDeck[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(deserializeDeck);
  } catch {
    return [];
  }
}

export async function saveDecks(decks: DeckState[]): Promise<void> {
  const payload = decks.map(serializeDeck);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function getDeck(id: string): Promise<DeckState | null> {
  const decks = await loadDecks();
  return decks.find((deck) => deck.id === id) ?? null;
}

export async function upsertDeck(deck: DeckState): Promise<void> {
  const decks = await loadDecks();
  const index = decks.findIndex((entry) => entry.id === deck.id);
  if (index >= 0) {
    decks[index] = deck;
  } else {
    decks.unshift(deck);
  }
  await saveDecks(decks);
}

export async function deleteDeck(id: string): Promise<void> {
  const decks = await loadDecks();
  await saveDecks(decks.filter((deck) => deck.id !== id));
}

export async function createDeck(name = 'New Deck'): Promise<DeckState> {
  const deck = createEmptyDeck(name);
  await upsertDeck(deck);
  return deck;
}
