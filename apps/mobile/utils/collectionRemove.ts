import type { CardListItem } from '@riftbound/contracts';
import { compactMap } from '@/lib/iteration';
import {
  expandVariantFinishPrintings,
  formatPrintingLabel,
  getCardPrintings,
  getSearchGroupVariants,
  ownedQuantityForPrinting,
} from '@/utils/variants';

export interface CollectedPrintingRow {
  variantNumber: string;
  label: string;
  quantity: number;
  isFoil: boolean;
}

export function getCollectedPrintingsForListCard(
  card: CardListItem,
  byVariant: ReadonlyMap<string, { quantity: number }>
): CollectedPrintingRow[] {
  return compactMap(getCardPrintings(card), (p) => {
    const quantity = ownedQuantityForPrinting(byVariant, p);
    if (quantity <= 0) return null;
    return {
      variantNumber: p.variantNumber,
      label: formatPrintingLabel(p.variantLabel, p.isFoil, p.variantNumber),
      quantity,
      isFoil: p.isFoil,
    };
  });
}

export function getCollectedPrintingsForDetailCard(
  card: {
    variants: Array<{
      variantNumber: string;
      variantLabel: string;
      variantType: string;
      foilMode?: string;
    }>;
  },
  byVariant: ReadonlyMap<string, { quantity: number }>,
  anchor?: {
    variantNumber: string;
    variantLabel: string;
    variantType: string;
    foilMode?: string;
  }
): CollectedPrintingRow[] {
  const variants = anchor
    ? getSearchGroupVariants(card.variants, anchor)
    : card.variants;

  return compactMap(expandVariantFinishPrintings(variants), (p) => {
    const quantity = ownedQuantityForPrinting(byVariant, p);
    if (quantity <= 0) return null;
    return {
      variantNumber: p.variantNumber,
      label: formatPrintingLabel(p.variantLabel, p.isFoil, p.variantNumber),
      quantity,
      isFoil: p.isFoil,
    };
  });
}
