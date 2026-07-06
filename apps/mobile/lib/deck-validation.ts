import type { DeckState, DeckValidationMessage } from '@/lib/deck-types';
import { getSectionCount } from '@/lib/deck-card';

function domainIdentityMatch(cardDomains: string[], legendDomains: Set<string>): boolean {
  if (!cardDomains.length) return true;
  return cardDomains.every((domain) => legendDomains.has(domain));
}

function increment(map: Map<string, number>, key: string, amount: number): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

export function validateDeck(deck: DeckState): DeckValidationMessage[] {
  const messages: DeckValidationMessage[] = [];
  const legend = deck.legend;
  const champion = deck.champion;
  const mainDeckTotal = getSectionCount(deck, 'mainDeck');
  const runeTotal = getSectionCount(deck, 'runes');
  const battlefieldTotal = getSectionCount(deck, 'battlefields');

  if (!legend) {
    messages.push({ type: 'error', message: 'No Champion Legend selected (need 1).' });
  }

  if (!champion) {
    messages.push({ type: 'error', message: 'No Chosen Champion selected (need 1).' });
  } else if (legend) {
    const hasMatchingTag = legend.tags.some((tag) => champion.tags.includes(tag));
    if (!hasMatchingTag) {
      messages.push({
        type: 'error',
        message: `Chosen Champion "${champion.name}" must share a champion tag with your Legend "${legend.name}".`,
      });
    }

    if ((champion.super ?? '').toLowerCase() !== 'champion') {
      messages.push({
        type: 'error',
        message: `Chosen Champion "${champion.name}" must be a Champion Unit (supertype: Champion).`,
      });
    }
  }

  if (legend) {
    const legendDomains = new Set(legend.colors);

    for (const [name, entry] of deck.mainDeck) {
      if (!domainIdentityMatch(entry.card.colors, legendDomains)) {
        messages.push({
          type: 'error',
          message: `"${name}" does not match your Legend's Domain Identity.`,
        });
      }
    }

    for (const [name, entry] of deck.runes) {
      if (!domainIdentityMatch(entry.card.colors, legendDomains)) {
        messages.push({
          type: 'error',
          message: `Rune "${name}" does not match your Legend's Domain Identity.`,
        });
      }
    }

    if (champion && !domainIdentityMatch(champion.colors, legendDomains)) {
      messages.push({
        type: 'error',
        message: `Chosen Champion "${champion.name}" does not match your Legend's Domain Identity.`,
      });
    }
  }

  const allNameCounts = new Map<string, number>();
  if (champion) increment(allNameCounts, champion.name, 1);
  for (const [name, entry] of deck.mainDeck) increment(allNameCounts, name, entry.count);
  for (const [name, entry] of deck.runes) increment(allNameCounts, name, entry.count);
  for (const [name, entry] of deck.battlefields) increment(allNameCounts, name, entry.count);
  for (const [name, entry] of deck.sideboard) increment(allNameCounts, name, entry.count);

  for (const [name, count] of allNameCounts) {
    const isRune = deck.runes.has(name);
    const maxCopies = isRune ? 12 : 3;
    if (count > maxCopies) {
      messages.push({
        type: 'error',
        message: `"${name}" has ${count} copies (max ${maxCopies}).`,
      });
    }
  }

  let signatureCount = 0;
  for (const [, entry] of deck.mainDeck) {
    if (entry.card.isSignature) signatureCount += entry.count;
  }
  if (signatureCount > 3) {
    messages.push({
      type: 'error',
      message: `${signatureCount} Signature cards in deck (max 3 total).`,
    });
  }

  if (legend) {
    for (const [name, entry] of deck.mainDeck) {
      if (!entry.card.isSignature) continue;
      const hasMatch = legend.tags.some((tag) => entry.card.tags.includes(tag));
      if (!hasMatch) {
        messages.push({
          type: 'error',
          message: `Signature card "${name}" must share a Champion tag with your Legend.`,
        });
      }
    }
  }

  if (mainDeckTotal < 39) {
    messages.push({
      type: 'warning',
      message: `Main Deck has ${mainDeckTotal} cards (need at least 39, plus Chosen Champion = 40).`,
    });
  }

  if (runeTotal !== 12) {
    messages.push({
      type: runeTotal < 12 ? 'warning' : 'error',
      message: `Rune Deck has ${runeTotal} cards (need exactly 12).`,
    });
  }

  if (battlefieldTotal !== 3) {
    messages.push({
      type: battlefieldTotal < 3 ? 'warning' : 'error',
      message: `Battlefields: ${battlefieldTotal} (need exactly 3).`,
    });
  }

  for (const [name, entry] of deck.battlefields) {
    if (entry.count > 1) {
      messages.push({
        type: 'error',
        message: `Battlefield "${name}" appears ${entry.count} times (max 1 of each name).`,
      });
    }
  }

  const sideboardTotal = getSectionCount(deck, 'sideboard');
  if (sideboardTotal > 8) {
    messages.push({
      type: 'error',
      message: `Sideboard has ${sideboardTotal} cards (max 8).`,
    });
  }

  if (messages.length === 0) {
    messages.push({ type: 'valid', message: 'Deck is valid!' });
  }

  return messages;
}

export function deckHasErrors(messages: DeckValidationMessage[]): boolean {
  return messages.some((message) => message.type === 'error');
}

export function ownedCountForCardName(
  name: string,
  collectionByName: ReadonlyMap<string, number>
): number | null {
  if (!collectionByName.size) return null;
  return collectionByName.get(name) ?? 0;
}
