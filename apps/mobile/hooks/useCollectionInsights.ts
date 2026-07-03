import { useQuery } from '@tanstack/react-query';
import type { CollectionEntry } from '@/services/collectionService';
import { api } from '@/src/api/client';
import { formatMarketTrend, isFoilVariant } from '@/utils/variants';

export function useCollectionInsights(collection: CollectionEntry[]) {
  const variantNumbers = collection.map((e) => e.variantNumber);

  return useQuery({
    queryKey: ['collection', 'insights', variantNumbers.sort().join(',')],
    queryFn: async () => {
      if (variantNumbers.length === 0) {
        return { estimatedValue: 0, movers: [] as { entry: CollectionEntry; trend: string }[] };
      }

      const batch = await api.batchCards(variantNumbers.slice(0, 100));
      const detailByVariant = new Map<string, (typeof batch.data)[number]>();

      for (const card of batch.data) {
        for (const v of card.variants) {
          detailByVariant.set(v.variantNumber, card);
        }
      }

      let estimatedValue = 0;
      const movers: { entry: CollectionEntry; trend: string; magnitude: number }[] = [];

      for (const entry of collection) {
        const card = detailByVariant.get(entry.variantNumber);
        if (!card) continue;
        const variant = card.variants.find((v) => v.variantNumber === entry.variantNumber);
        if (!variant) continue;

        const foil = isFoilVariant(
          variant.variantNumber,
          variant.variantLabel,
          variant.variantType
        );
        const priceRow =
          variant.prices.find((p) => p.isFoil === foil) ?? variant.prices[0];
        const unit = priceRow?.market ?? priceRow?.low ?? 0;
        estimatedValue += unit * entry.quantity;

        const trend = formatMarketTrend(
          priceRow
            ? {
                currency: 'EUR',
                low: priceRow.low,
                market: priceRow.market,
                avg7d: priceRow.avg7d,
                isFoil: priceRow.isFoil,
              }
            : null
        );
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
