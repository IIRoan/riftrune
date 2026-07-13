import { api } from '@/src/api/client';
import { collectIllegalCardNames } from '@/lib/card-legality';
import { getDeckVariantNumbers } from '@/lib/deck-card';
import type { DeckCard, DeckEntry, DeckState } from '@/lib/deck-types';

export async function fetchBanDatesByVariant(
  variantNumbers: string[]
): Promise<Map<string, string | null>> {
  const banByVariant = new Map<string, string | null>();
  const unique = [...new Set(variantNumbers.filter(Boolean))];
  if (unique.length === 0) return banByVariant;

  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const { data } = await api.batchCards(chunk);
    for (const detail of data) {
      const banDate = detail.banEffectiveDate ?? null;
      for (const variant of detail.variants) {
        if (chunk.includes(variant.variantNumber)) {
          banByVariant.set(variant.variantNumber, banDate);
        }
      }
    }
  }

  for (const variantNumber of unique) {
    if (!banByVariant.has(variantNumber)) {
      banByVariant.set(variantNumber, null);
    }
  }

  return banByVariant;
}

function applyBanDate(
  card: DeckCard,
  banByVariant: ReadonlyMap<string, string | null>
): DeckCard {
  const fresh = banByVariant.get(card.variantNumber);
  if (fresh === undefined) return card;
  return { ...card, banEffectiveDate: fresh };
}

function mapSection(
  map: Map<string, DeckEntry>,
  banByVariant: ReadonlyMap<string, string | null>
): Map<string, DeckEntry> {
  const next = new Map(map);
  for (const [key, entry] of next) {
    next.set(key, { ...entry, card: applyBanDate(entry.card, banByVariant) });
  }
  return next;
}

/** Overwrites deck card ban dates with fresh catalog values. */
export function mergeBanDatesIntoDeck(
  deck: DeckState,
  banByVariant: ReadonlyMap<string, string | null>
): DeckState {
  return {
    ...deck,
    legend: deck.legend ? applyBanDate(deck.legend, banByVariant) : null,
    champion: deck.champion ? applyBanDate(deck.champion, banByVariant) : null,
    mainDeck: mapSection(deck.mainDeck, banByVariant),
    runes: mapSection(deck.runes, banByVariant),
    battlefields: mapSection(deck.battlefields, banByVariant),
    sideboard: mapSection(deck.sideboard, banByVariant),
  };
}

/** Derives tournament legality metadata from current deck card ban state. */
export function syncDeckLegalityFields(deck: DeckState): DeckState {
  const illegalNames = collectIllegalCardNames(deck);
  if (illegalNames.length === 0) {
    return {
      ...deck,
      bannedCardNames: undefined,
      isLegal: deck.readOnly ? deck.isLegal : true,
    };
  }

  return {
    ...deck,
    isLegal: false,
    bannedCardNames: illegalNames,
  };
}

/** Fetches fresh catalog ban dates and updates deck legality metadata. */
export async function refreshDeckLegality(deck: DeckState): Promise<DeckState> {
  const banByVariant = await fetchBanDatesByVariant(getDeckVariantNumbers(deck));
  return syncDeckLegalityFields(mergeBanDatesIntoDeck(deck, banByVariant));
}

/** Applies refreshed legality onto a deck without touching unrelated fields. */
export function overlayDeckLegality(base: DeckState, refreshed: DeckState): DeckState {
  return {
    ...base,
    isLegal: refreshed.isLegal,
    bannedCardNames: refreshed.bannedCardNames,
    legend: refreshed.legend,
    champion: refreshed.champion,
    mainDeck: refreshed.mainDeck,
    runes: refreshed.runes,
    battlefields: refreshed.battlefields,
    sideboard: refreshed.sideboard,
  };
}
