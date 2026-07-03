import { useQuery } from '@tanstack/react-query';
import type { CardListItem } from '@riftbound/contracts';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';
import { getCardPrintings, groupCatalogListItems, normalizeCardListItems, normalizeCardsListResponse } from '@/utils/variants';

export const FEATURED_CATALOG_SIZE = 12;

function priceScore(card: CardListItem): number {
  const printings = getCardPrintings(card);
  const printingPrices = printings.map(
    (p) => p.priceEur?.market ?? p.priceEur?.low ?? 0
  );
  const primary = card.priceEur?.market ?? card.priceEur?.low ?? 0;
  return Math.max(primary, ...printingPrices, 0);
}

export function useFeaturedCatalog() {
  return useQuery({
    queryKey: cardQueryKeys.featured(FEATURED_CATALOG_SIZE),
    queryFn: async () => {
      const response = await api.listCards({ limit: 100, page: 1, sortBy: 'name', dir: 'asc' });
      const normalized = normalizeCardsListResponse(response);
      const items = groupCatalogListItems(normalizeCardListItems(normalized.data));
      return [...items]
        .sort((a, b) => priceScore(b) - priceScore(a))
        .slice(0, FEATURED_CATALOG_SIZE);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
