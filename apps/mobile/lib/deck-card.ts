import type { CardDetail, CardListItem } from '@riftbound/contracts';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { findVariantByNumber } from '@/utils/variants';
import type {
  DeckCard,
  DeckEntry,
  DeckSectionKey,
  DeckState,
  SerializedDeck,
  SerializedDeckEntry,
} from '@/lib/deck-types';

export function isSignatureVariant(rarity: string, variantType: string): boolean {
  const combined = `${rarity} ${variantType}`.toLowerCase();
  return combined.includes('signature');
}

export function deckCardFromDetail(card: CardDetail, variantNumber: string): DeckCard {
  const variant =
    findVariantByNumber(card.variants, variantNumber) ?? card.variants[0];
  const setCode = variant.variantNumber.split('-')[0] ?? '';

  return {
    cardId: card.id,
    variantNumber: variant.variantNumber,
    name: card.name,
    type: card.type,
    super: card.super,
    tags: card.tags,
    colors: card.colors.map((color) => color.name),
    energy: card.energy,
    setCode,
    rarity: variant.rarity,
    variantType: variant.variantType,
    isSignature: isSignatureVariant(variant.rarity, variant.variantType),
    imageUrl: variant.imageUrl ?? null,
  };
}

/** Placeholder deck card from catalog list data before detail loads. */
export function deckCardFromListItem(card: CardListItem): DeckCard {
  return {
    cardId: card.cardId,
    variantNumber: card.variantNumber,
    name: card.name,
    type: card.type,
    super: null,
    tags: [],
    colors: card.colors,
    energy: card.energy,
    setCode: card.setCode,
    rarity: card.rarity,
    variantType: 'Standard',
    isSignature: isSignatureVariant(card.rarity, ''),
    imageUrl: card.imageUrl ?? null,
  };
}

export function getDeckVariantNumbers(deck: DeckState): string[] {
  const numbers: string[] = [];
  if (deck.legend) numbers.push(deck.legend.variantNumber);
  if (deck.champion) numbers.push(deck.champion.variantNumber);
  for (const section of ['mainDeck', 'runes', 'battlefields', 'sideboard'] as const) {
    for (const [, entry] of deck[section]) {
      numbers.push(entry.card.variantNumber);
    }
  }
  return numbers;
}

export function resolveDeckCardImageUrl(
  card: DeckCard,
  imageByVariant: ReadonlyMap<string, string>
): string {
  if (card.imageUrl) return resolveImageUrl(card.imageUrl);
  const fetched = imageByVariant.get(card.variantNumber);
  return fetched ? resolveImageUrl(fetched) : '';
}

export function sectionForCardType(card: Pick<DeckCard, 'type' | 'super'>): DeckSectionKey {
  const type = card.type.toLowerCase();
  const supertype = (card.super ?? '').toLowerCase();
  if (type === 'legend') return 'legend';
  if (type === 'battlefield') return 'battlefields';
  if (type === 'rune') return 'runes';
  if (supertype === 'champion') return 'champion';
  return 'mainDeck';
}

export function createDeckId(): string {
  return `deck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyDeck(name = 'New Deck'): DeckState {
  const now = Date.now();
  return {
    id: createDeckId(),
    name,
    createdAt: now,
    updatedAt: now,
    legend: null,
    champion: null,
    mainDeck: new Map(),
    runes: new Map(),
    battlefields: new Map(),
    sideboard: new Map(),
    addToSideboard: false,
  };
}

export function getSectionEntries(
  deck: DeckState,
  section: DeckSectionKey
): Map<string, DeckEntry> | DeckCard | null {
  if (section === 'legend') return deck.legend;
  if (section === 'champion') return deck.champion;
  return deck[section];
}

export function getSectionCount(deck: DeckState, section: DeckSectionKey): number {
  if (section === 'legend' || section === 'champion') {
    return deck[section] ? 1 : 0;
  }
  let total = 0;
  for (const [, entry] of deck[section]) {
    total += entry.count;
  }
  return total;
}

export function addCardToDeck(
  deck: DeckState,
  card: DeckCard,
  options?: { section?: DeckSectionKey; count?: number }
): DeckState {
  const count = options?.count ?? 1;
  const targetSection = options?.section ?? resolveAddSection(deck, card);
  const updatedAt = Date.now();

  if (targetSection === 'legend') {
    return { ...deck, legend: card, updatedAt };
  }
  if (targetSection === 'champion') {
    return { ...deck, champion: card, updatedAt };
  }

  const map = new Map(deck[targetSection]);
  const existing = map.get(card.name);
  if (existing) {
    map.set(card.name, { card: existing.card, count: existing.count + count });
  } else {
    map.set(card.name, { card, count });
  }

  return { ...deck, [targetSection]: map, updatedAt };
}

function resolveAddSection(deck: DeckState, card: DeckCard): DeckSectionKey {
  const inferred = sectionForCardType(card);
  if (inferred !== 'mainDeck') return inferred;
  if (deck.addToSideboard && getSectionCount(deck, 'sideboard') < 8) {
    return 'sideboard';
  }
  return 'mainDeck';
}

export function changeDeckCardQty(
  deck: DeckState,
  section: Exclude<DeckSectionKey, 'legend' | 'champion'>,
  name: string,
  delta: number
): DeckState {
  const map = new Map(deck[section]);
  const entry = map.get(name);
  if (!entry) return deck;

  const nextCount = entry.count + delta;
  if (nextCount <= 0) {
    map.delete(name);
  } else {
    map.set(name, { ...entry, count: nextCount });
  }

  return { ...deck, [section]: map, updatedAt: Date.now() };
}

export function removeDeckCard(
  deck: DeckState,
  section: DeckSectionKey,
  name?: string
): DeckState {
  if (section === 'legend') {
    return { ...deck, legend: null, updatedAt: Date.now() };
  }
  if (section === 'champion') {
    return { ...deck, champion: null, updatedAt: Date.now() };
  }
  if (!name) return deck;
  const map = new Map(deck[section]);
  map.delete(name);
  return { ...deck, [section]: map, updatedAt: Date.now() };
}

export function serializeDeck(deck: DeckState): SerializedDeck {
  const toEntries = (map: Map<string, DeckEntry>): SerializedDeckEntry[] =>
    [...map.values()].map((entry) => ({ card: entry.card, count: entry.count }));

  return {
    id: deck.id,
    name: deck.name,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    legend: deck.legend,
    champion: deck.champion,
    mainDeck: toEntries(deck.mainDeck),
    runes: toEntries(deck.runes),
    battlefields: toEntries(deck.battlefields),
    sideboard: toEntries(deck.sideboard),
  };
}

export function deserializeDeck(data: SerializedDeck): DeckState {
  const toMap = (entries: SerializedDeckEntry[]): Map<string, DeckEntry> => {
    const map = new Map<string, DeckEntry>();
    for (const entry of entries) {
      map.set(entry.card.name, entry);
    }
    return map;
  };

  return {
    id: data.id,
    name: data.name,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    legend: data.legend,
    champion: data.champion,
    mainDeck: toMap(data.mainDeck),
    runes: toMap(data.runes),
    battlefields: toMap(data.battlefields),
    sideboard: toMap(data.sideboard),
    addToSideboard: false,
  };
}
