import { totalRuneCount } from '@/lib/deck-builder';
import { getSectionCount } from '@/lib/deck-card';
import { deckSectionProgress } from '@/lib/deck-display';
import type { DeckState } from '@/lib/deck-types';

/** One-line deck stats for headers (add flow, etc.). */
export function deckBuilderHeadlineStats(deck: DeckState): string {
  const formatLabel = deck.format === 'pre-rift' ? 'Pre-Rift' : 'Constructed';
  const main = deckSectionProgress(deck, 'mainDeck');
  const runes = totalRuneCount(deck.runes);
  const fields = getSectionCount(deck, 'battlefields');
  const side = getSectionCount(deck, 'sideboard');
  return `${formatLabel} · Main ${main.current}/${main.target} · Runes ${runes}/12 · Fields ${fields}/3 · Side ${side}/8`;
}
