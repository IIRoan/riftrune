import type { DeckCard, DeckEntry, DeckSectionKey, DeckState } from '@/lib/deck-types';

type DeckCardRef = Pick<DeckCard, 'cardId' | 'variantNumber' | 'name'>;

/** Whether two catalog/deck cards refer to the same logical card. */
export function deckCardsMatch(a: DeckCardRef, b: DeckCardRef): boolean {
  if (a.cardId && b.cardId && a.cardId === b.cardId) return true;
  if (a.variantNumber && b.variantNumber && a.variantNumber === b.variantNumber) return true;
  return a.name === b.name;
}

export function deckAddUsesSingleSelectUi(section: DeckSectionKey): boolean {
  return section === 'legend' || section === 'champion' || section === 'battlefields';
}

/** Deck entry for a catalog candidate in a section, if present. */
export function findDeckEntryForCandidate(
  deck: DeckState,
  section: DeckSectionKey,
  candidate: DeckCardRef
): DeckEntry | null {
  if (section === 'legend') {
    return deck.legend && deckCardsMatch(deck.legend, candidate)
      ? { card: deck.legend, count: 1 }
      : null;
  }
  if (section === 'champion') {
    return deck.champion && deckCardsMatch(deck.champion, candidate)
      ? { card: deck.champion, count: 1 }
      : null;
  }

  const byName = deck[section].get(candidate.name);
  if (byName) return byName;

  for (const entry of deck[section].values()) {
    if (deckCardsMatch(entry.card, candidate)) return entry;
  }
  return null;
}

export function getDeckCandidateCount(
  deck: DeckState,
  section: DeckSectionKey,
  candidate: DeckCardRef
): number {
  return findDeckEntryForCandidate(deck, section, candidate)?.count ?? 0;
}

export function isDeckCandidateInSection(
  deck: DeckState,
  section: DeckSectionKey,
  candidate: DeckCardRef
): boolean {
  return getDeckCandidateCount(deck, section, candidate) > 0;
}

/** FlatList extraData key — changes when section membership or counts change. */
export function deckMembershipRevision(deck: DeckState): string {
  const parts: string[] = [String(deck.updatedAt)];
  if (deck.legend) parts.push(`L:${deck.legend.variantNumber}`);
  if (deck.champion) parts.push(`C:${deck.champion.variantNumber}`);

  for (const section of ['battlefields', 'mainDeck', 'runes', 'sideboard'] as const) {
    const entries = [...deck[section].entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [name, entry] of entries) {
      parts.push(`${section}:${name}:${entry.count}:${entry.card.variantNumber}`);
    }
  }

  return parts.join('|');
}
