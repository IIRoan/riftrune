import { useQuery } from '@tanstack/react-query';
import { runeNameForDomain } from '@riftbound/contracts';
import type { DeckCard } from '@/lib/deck-types';
import { deckCardFromDetail } from '@/lib/deck-card';
import { getLegendRuneDomains } from '@/lib/deck-builder';
import { api } from '@/src/api/client';

async function fetchRuneCard(domain: string): Promise<DeckCard | null> {
  const name = runeNameForDomain(domain);
  const response = await api.listCards({
    q: name,
    types: 'Rune',
    limit: 1,
    page: 1,
    sortBy: 'name',
    dir: 'asc',
  });
  const item = response.data[0];
  if (!item) return null;

  const detail = await api.getCard(item.variantNumber);
  return deckCardFromDetail(detail.data, item.variantNumber);
}

export function useLegendRuneCards(legend: DeckCard | null) {
  const domains = legend ? getLegendRuneDomains(legend) : null;

  return useQuery({
    queryKey: [
      'legend-rune-cards',
      legend?.variantNumber ?? 'none',
      domains?.join('/'),
    ],
    queryFn: async () => {
      if (!domains) return { byDomain: new Map<string, DeckCard>() };
      const [first, second] = domains;
      const [firstCard, secondCard] = await Promise.all([
        fetchRuneCard(first),
        first === second ? null : fetchRuneCard(second),
      ]);

      const byDomain = new Map<string, DeckCard>();
      if (firstCard) byDomain.set(first, firstCard);
      if (secondCard) byDomain.set(second, secondCard);
      else if (firstCard && first === second) byDomain.set(second, firstCard);

      return { byDomain };
    },
    enabled: Boolean(legend && domains),
    staleTime: 60 * 60 * 1000,
  });
}
