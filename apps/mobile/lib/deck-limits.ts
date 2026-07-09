import { RIFTBOUND_DECK_RULES } from '@riftbound/contracts';
import { getSectionCount } from '@/lib/deck-card';
import type { DeckState } from '@/lib/deck-types';

export const BATTLEFIELD_MAX = RIFTBOUND_DECK_RULES.sections.battlefields.target;

export function battlefieldCount(deck: DeckState): number {
  return getSectionCount(deck, 'battlefields');
}

export function battlefieldsAtCapacity(deck: DeckState): boolean {
  return battlefieldCount(deck) >= BATTLEFIELD_MAX;
}

export function battlefieldSlotsRemaining(deck: DeckState): number {
  return Math.max(0, BATTLEFIELD_MAX - battlefieldCount(deck));
}

export function canAddBattlefield(deck: DeckState, candidateName: string): boolean {
  if (deck.battlefields.has(candidateName)) return false;
  return !battlefieldsAtCapacity(deck);
}
