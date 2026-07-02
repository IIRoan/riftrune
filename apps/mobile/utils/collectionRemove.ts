import type { CardListItem } from '@riftbound/contracts';
import type { CollectionEntry } from '@/services/collectionService';
import { formatPrintingLabel, getCardPrintings, isFoilVariant } from '@/utils/variants';

export interface CollectedPrintingRow {
  variantNumber: string;
  label: string;
  quantity: number;
}

export function getCollectedPrintingsForListCard(
  card: CardListItem,
  byVariant: ReadonlyMap<string, CollectionEntry>
): CollectedPrintingRow[] {
  return getCardPrintings(card)
    .filter((p) => byVariant.has(p.variantNumber))
    .map((p) => {
      const entry = byVariant.get(p.variantNumber)!;
      return {
        variantNumber: p.variantNumber,
        label: formatPrintingLabel(p.variantLabel, p.isFoil, p.variantNumber),
        quantity: entry.quantity,
      };
    });
}

export function getCollectedPrintingsForDetailCard(
  card: {
    variants: Array<{
      variantNumber: string;
      variantLabel: string;
      variantType: string;
    }>;
  },
  byVariant: ReadonlyMap<string, CollectionEntry>
): CollectedPrintingRow[] {
  return card.variants
    .filter((v) => byVariant.has(v.variantNumber))
    .map((v) => {
      const entry = byVariant.get(v.variantNumber)!;
      const foil = isFoilVariant(v.variantNumber, v.variantLabel, v.variantType);
      return {
        variantNumber: v.variantNumber,
        label: formatPrintingLabel(v.variantLabel, foil, v.variantNumber),
        quantity: entry.quantity,
      };
    });
}
