import { resolveDeckCardImageUrl } from '@/lib/deck-card';
import type { DeckCard } from '@/lib/deck-types';

export function resolveSlotImage(
  card: DeckCard,
  imageByVariant: ReadonlyMap<string, string>
): string {
  return resolveDeckCardImageUrl(card, imageByVariant);
}
