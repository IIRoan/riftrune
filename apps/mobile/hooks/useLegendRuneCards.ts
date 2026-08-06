import { useQuery } from '@tanstack/react-query';
import type { DeckFormat } from '@riftbound/contracts';
import { runeNameForDomain } from '@riftbound/contracts';
import type { DeckCard } from '@/lib/deck-types';
import { deckCardFromDetail } from '@/lib/deck-card';
import { getLegendRuneDomains } from '@/lib/deck-builder';
import { DOMAIN_KEYWORD_NAMES } from '@/lib/card-keywords';
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

function domainsForDeck(legend: DeckCard | null, format: DeckFormat): string[] | null {
  if (format === 'pre-rift') {
    return [...DOMAIN_KEYWORD_NAMES];
  }
  if (!legend) return null;
  const [first, second] = getLegendRuneDomains(legend);
  return first === second ? [first] : [first, second];
}

export function useDeckRuneCards(deck: {
  legend: DeckCard | null;
  format: DeckFormat;
}) {
  const domains = domainsForDeck(deck.legend, deck.format);

  return useQuery({
    queryKey: [
      'deck-rune-cards',
      deck.format,
      deck.legend?.variantNumber ?? 'none',
      domains?.join('/'),
    ],
    queryFn: async () => {
      if (!domains?.length) return { byDomain: new Map<string, DeckCard>() };

      const entries = await Promise.all(
        domains.map(async (domain) => {
          const card = await fetchRuneCard(domain);
          return { domain, card };
        })
      );

      const byDomain = new Map<string, DeckCard>();
      for (const { domain, card } of entries) {
        if (card) byDomain.set(domain, card);
      }

      return { byDomain };
    },
    enabled: Boolean(domains?.length),
    staleTime: 60 * 60 * 1000,
  });
}
