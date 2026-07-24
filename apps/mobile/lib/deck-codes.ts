import {
  getCodeFromDeck,
  getDeckFromCode,
  type Card as DeckCodeCard,
  type DecodeOptions,
  type DeckWithSideboard,
} from '@piltoverarchive/riftbound-deck-codes';
import { addCardToDeck, createEmptyDeck, sectionForCardType } from '@/lib/deck-card';
import type { DeckCard, DeckState } from '@/lib/deck-types';

export type VariantResolver = (
  variantNumber: string
) => Promise<DeckCard | null> | DeckCard | null;

/** Base32 alphabet used by Piltover Archive deck codes (no padding). */
const DECK_CODE_CHAR = /^[A-Z2-7]+$/i;

/** Minimum plausible encoded length (tiny v3 decks still clear this). */
const MIN_DECK_CODE_LENGTH = 16;

function mergeCount(
  counts: Map<string, number>,
  cardCode: string,
  count: number
): void {
  counts.set(cardCode, (counts.get(cardCode) ?? 0) + count);
}

function countsToDeck(counts: Map<string, number>): DeckCodeCard[] {
  return [...counts.entries()].map(([cardCode, count]) => ({ cardCode, count }));
}

/**
 * Flatten a Riftrune deck into the Piltover Archive encoder shape.
 * Legend, champion, main, runes, and battlefields all live in `mainDeck`;
 * `chosenChampion` is the champion slot's variant number when set.
 */
export function deckStateToCodePayload(deck: DeckState): {
  mainDeck: DeckCodeCard[];
  sideboard: DeckCodeCard[];
  chosenChampion?: string;
} {
  const mainCounts = new Map<string, number>();

  if (deck.legend) {
    mergeCount(mainCounts, deck.legend.variantNumber, 1);
  }
  if (deck.champion) {
    mergeCount(mainCounts, deck.champion.variantNumber, 1);
  }
  for (const [, entry] of deck.mainDeck) {
    mergeCount(mainCounts, entry.card.variantNumber, entry.count);
  }
  for (const [, entry] of deck.runes) {
    mergeCount(mainCounts, entry.card.variantNumber, entry.count);
  }
  for (const [, entry] of deck.battlefields) {
    mergeCount(mainCounts, entry.card.variantNumber, entry.count);
  }

  const sideCounts = new Map<string, number>();
  for (const [, entry] of deck.sideboard) {
    mergeCount(sideCounts, entry.card.variantNumber, entry.count);
  }

  const chosenChampion = deck.champion?.variantNumber;
  return {
    mainDeck: countsToDeck(mainCounts),
    sideboard: countsToDeck(sideCounts),
    ...(chosenChampion ? { chosenChampion } : {}),
  };
}

/** Encode a Riftrune deck as a Piltover Archive deck code (1:1 with upstream). */
export function exportDeckCode(deck: DeckState): string {
  const payload = deckStateToCodePayload(deck);
  return getCodeFromDeck(payload.mainDeck, payload.sideboard, payload.chosenChampion);
}

/**
 * True when `text` looks like a Riftbound deck code (base32, no whitespace).
 * Does not guarantee a successful decode — call `decodeDeckCode` for that.
 */
export function looksLikeDeckCode(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_DECK_CODE_LENGTH) return false;
  if (/\s/.test(trimmed)) return false;
  return DECK_CODE_CHAR.test(trimmed);
}

export function decodeDeckCode(
  code: string,
  options?: DecodeOptions
): DeckWithSideboard {
  return getDeckFromCode(code.trim(), options);
}

/**
 * Place decoded card codes into Riftrune sections.
 * When `chosenChampion` is set, one copy of that code goes to the champion slot
 * and any remaining copies follow normal type routing (usually main deck).
 */
export async function deckFromCodePayload(
  decoded: DeckWithSideboard,
  resolveCard: VariantResolver
): Promise<{ deck: DeckState; unresolved: string[] }> {
  let deck = createEmptyDeck();
  const unresolved: string[] = [];
  const chosen = decoded.chosenChampion;

  const place = async (cardCode: string, count: number, forceSideboard: boolean) => {
    let remaining = count;
    const card = await resolveCard(cardCode);
    if (!card) {
      unresolved.push(cardCode);
      return;
    }

    if (!forceSideboard && chosen && cardCode === chosen && !deck.champion) {
      deck = { ...deck, champion: card };
      remaining -= 1;
    }

    if (remaining <= 0) return;

    if (forceSideboard) {
      deck = addCardToDeck(deck, card, { section: 'sideboard', count: remaining });
      return;
    }

    const section = sectionForCardType(card);
    if (section === 'legend') {
      deck = { ...deck, legend: card };
      if (remaining > 1) {
        deck = addCardToDeck(deck, card, { section: 'mainDeck', count: remaining - 1 });
      }
      return;
    }
    if (section === 'champion') {
      // Extra champion-unit copies beyond the chosen slot live in the main deck.
      deck = addCardToDeck(deck, card, { section: 'mainDeck', count: remaining });
      return;
    }
    deck = addCardToDeck(deck, card, { section, count: remaining });
  };

  for (const entry of decoded.mainDeck) {
    await place(entry.cardCode, entry.count, false);
  }
  for (const entry of decoded.sideboard) {
    await place(entry.cardCode, entry.count, true);
  }

  return { deck, unresolved };
}

export async function importDeckCode(
  code: string,
  resolveCard: VariantResolver,
  options?: DecodeOptions
): Promise<{ deck: DeckState; unresolved: string[] }> {
  const decoded = decodeDeckCode(code, options);
  return deckFromCodePayload(decoded, resolveCard);
}

/** Stable sort for comparing encoded decks in tests (order is not significant). */
export function sortCodeCards(cards: DeckCodeCard[]): DeckCodeCard[] {
  return [...cards].sort((a, b) => {
    if (a.cardCode !== b.cardCode) return a.cardCode.localeCompare(b.cardCode);
    return a.count - b.count;
  });
}
