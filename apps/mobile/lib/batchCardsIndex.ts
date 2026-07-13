import type { CardDetail } from '@riftbound/contracts';
import { chunkArray } from '@riftbound/contracts';
import { api } from '@/src/api/client';

/** Batch-fetch card details and index them by variant number. */
export async function fetchCardDetailsByVariant(
  variantNumbers: string[]
): Promise<Map<string, CardDetail>> {
  const detailByVariant = new Map<string, CardDetail>();
  const unique = [...new Set(variantNumbers.filter(Boolean))];
  if (unique.length === 0) return detailByVariant;

  for (const batch of chunkArray(unique, 100)) {
    const { data } = await api.batchCards(batch);
    for (const card of data) {
      for (const variant of card.variants) {
        if (batch.includes(variant.variantNumber)) {
          detailByVariant.set(variant.variantNumber, card);
        }
      }
    }
  }

  return detailByVariant;
}
