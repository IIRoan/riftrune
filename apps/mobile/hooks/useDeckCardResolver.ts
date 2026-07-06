import { useMemo } from 'react';
import type { CardsListQuery } from '@riftbound/contracts';
import { api } from '@/src/api/client';
import { deckCardFromDetail } from '@/lib/deck-card';
import type { DeckCard } from '@/lib/deck-types';
import type { DeckSectionKey } from '@/lib/deck-types';

const cardResolveCache = new Map<string, DeckCard>();

export function catalogQueryForSection(
  section: DeckSectionKey
): Partial<CardsListQuery> | undefined {
  switch (section) {
    case 'legend':
      return { types: 'Legend' };
    case 'battlefields':
      return { types: 'Battlefield' };
    case 'runes':
      return { types: 'Rune' };
    case 'champion':
      return { types: 'Unit' };
    default:
      return undefined;
  }
}

export async function resolveDeckCardByName(name: string): Promise<DeckCard | null> {
  const cached = cardResolveCache.get(name);
  if (cached) return cached;

  const response = await api.listCards({ q: name, limit: 20, page: 1 });
  const exact =
    response.data.find((card) => card.name === name) ??
    response.data.find((card) => card.name.replace(' - ', ', ') === name);

  if (!exact) return null;

  const detail = await api.getCard(exact.variantNumber);
  const deckCard = deckCardFromDetail(detail.data, exact.variantNumber);
  cardResolveCache.set(deckCard.name, deckCard);
  return deckCard;
}

export function useCollectionByCardName(
  collection: ReadonlyArray<{ name: string; quantity: number }>
): ReadonlyMap<string, number> {
  return useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of collection) {
      map.set(entry.name, (map.get(entry.name) ?? 0) + entry.quantity);
    }
    return map;
  }, [collection]);
}
