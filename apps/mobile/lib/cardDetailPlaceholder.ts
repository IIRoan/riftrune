import type { CardDetail, CardListItem } from '@riftbound/contracts';
import { getCardPrintings } from '@/utils/variants';

function placeholderVariantId(cardId: string, variantNumber: string, index: number): string {
  if (index === 0) return cardId;
  const slug = variantNumber
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .padEnd(12, '0')
    .slice(0, 12);
  return `00000000-0000-4000-8000-${slug}`;
}

/** Build a detail-shaped card from catalog list data for instant drawer rendering. */
export function cardListItemToDetail(listItem: CardListItem): CardDetail {
  const printings = getCardPrintings(listItem);

  return {
    id: listItem.cardId,
    name: listItem.name,
    type: listItem.type,
    super: null,
    description: '',
    energy: listItem.energy,
    might: listItem.might,
    power: listItem.power,
    tags: [],
    colors: listItem.colors.map((name) => ({
      id: `placeholder-color-${name}`,
      name,
    })),
    banEffectiveDate: listItem.isBanned
      ? // Placeholder so banned overlay renders before detail fetch lands.
        '1970-01-01T00:00:00.000Z'
      : null,
    variants: printings.map((printing, index) => ({
      id: placeholderVariantId(listItem.cardId, printing.variantNumber, index),
      variantNumber: printing.variantNumber,
      rarity: listItem.rarity,
      variantType: printing.isFoil ? 'Foil' : 'Standard',
      variantLabel: printing.variantLabel,
      imageUrl: listItem.imageUrl,
      cardmarketId: listItem.cardmarketId,
      tcgplayerId: null,
      releaseDate: null,
      artist: null,
      prices: printing.priceEur
        ? [printing.priceEur]
        : [
            {
              currency: 'EUR' as const,
              low: null,
              market: null,
              avg7d: null,
              isFoil: printing.isFoil,
            },
          ],
    })),
  };
}

export function cardListItemToDetailResponse(listItem: CardListItem): {
  data: CardDetail;
  meta: { source: 'cache'; contentHash: string };
} {
  return {
    data: cardListItemToDetail(listItem),
    meta: {
      source: 'cache',
      contentHash: 'list-placeholder',
    },
  };
}
