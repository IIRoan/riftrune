import { chunkArray } from '@riftbound/contracts';
import { useQuery } from '@tanstack/react-query';
import type { CollectionEntry } from '@/services/collectionService';
import { api } from '@/src/api/client';
import { formatMarketTrend, pickVariantDisplayPrice, toPriceEurSummary } from '@/utils/variants';

export function useCollectionInsights(collection: CollectionEntry[]) {
  const variantNumbers = [
    ...new Set(collection.map((entry) => entry.variantNumber)),
  ].sort();

  return useQuery({
    queryKey: ['collection', 'insights', variantNumbers.join(',')],
    queryFn: async () => {
      if (variantNumbers.length === 0) {
        return { estimatedValue: 0, movers: [] as { entry: CollectionEntry; trend: string }[] };
      }

      const detailByVariant = new Map<string, Awaited<ReturnType<typeof api.batchCards>>['data'][number]>();

      for (const batchVariantNumbers of chunkArray(variantNumbers, 100)) {
        const batch = await api.batchCards(batchVariantNumbers);
        for (const card of batch.data) {
          for (const variant of card.variants) {
            detailByVariant.set(variant.variantNumber, card);
          }
        }
      }

      let estimatedValue = 0;
      const movers: { entry: CollectionEntry; trend: string; magnitude: number }[] = [];

      for (const entry of collection) {
        const card = detailByVariant.get(entry.variantNumber);
        if (!card) continue;
        const variant = card.variants.find((v) => v.variantNumber === entry.variantNumber);
        if (!variant) continue;

        const priceRow = pickVariantDisplayPrice(variant.prices, variant);
        const unit = priceRow?.market ?? 0;
        estimatedValue += unit * entry.quantity;

        const trend = formatMarketTrend(toPriceEurSummary(priceRow));
        if (trend.startsWith('+') || trend.startsWith('-')) {
          const magnitude = Math.abs(parseFloat(trend));
          movers.push({ entry, trend, magnitude });
        }
      }

      movers.sort((a, b) => b.magnitude - a.magnitude);

      return {
        estimatedValue,
        movers: movers.slice(0, 5).map(({ entry, trend }) => ({ entry, trend })),
      };
    },
    enabled: variantNumbers.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
