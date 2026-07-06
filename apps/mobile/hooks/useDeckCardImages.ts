import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { findVariantByNumber } from '@/utils/variants';
import { api } from '@/src/api/client';

export const deckImageQueryKey = (variantNumbers: string[]) =>
  ['deck-card-images', [...variantNumbers].sort().join(',')] as const;

export function useDeckCardImages(variantNumbers: string[]) {
  const unique = useMemo(
    () => [...new Set(variantNumbers.filter(Boolean))],
    [variantNumbers]
  );

  return useQuery({
    queryKey: deckImageQueryKey(unique),
    queryFn: async () => {
      const map = new Map<string, string>();
      if (!unique.length) return map;

      const response = await api.batchCards(unique.slice(0, 100));
      for (const card of response.data) {
        for (const variant of card.variants) {
          if (variant.imageUrl) {
            map.set(variant.variantNumber, variant.imageUrl);
          }
        }
        const primary = findVariantByNumber(card.variants, card.variants[0]?.variantNumber ?? '');
        if (primary?.imageUrl) {
          map.set(primary.variantNumber, primary.imageUrl);
        }
      }
      return map;
    },
    enabled: unique.length > 0,
    staleTime: 5 * 60_000,
  });
}
