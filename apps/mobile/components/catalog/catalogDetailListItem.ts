import type { CardListItem, CardListPrinting } from '@riftbound/contracts';
import { isCardBannedAt } from '@riftbound/contracts';
import type { useCardDetail } from '@/hooks/useCardDetail';
import type { CollectionOwnershipMap } from '@/utils/collectionOwnership';
import {
  expandVariantFinishPrintings,
  getSearchGroupVariants,
  ownedQuantityForPrinting,
  pickVariantDisplayPrice,
  toPriceEurSummary,
} from '@/utils/variants';

type DetailCard = NonNullable<ReturnType<typeof useCardDetail>['card']>;
type DetailVariant = NonNullable<ReturnType<typeof useCardDetail>['activeVariant']>;

export function buildCatalogDetailListItem(
  card: DetailCard,
  activeVariant: DetailVariant,
  collectionByVariant: CollectionOwnershipMap
): CardListItem {
  const groupVariants = getSearchGroupVariants(card.variants, activeVariant);
  const expanded = expandVariantFinishPrintings(groupVariants);

  return {
    cardId: card.id,
    variantNumber: activeVariant.variantNumber,
    name: card.name,
    type: card.type,
    energy: card.energy,
    might: card.might,
    power: card.power,
    rarity: activeVariant.rarity,
    setCode: activeVariant.variantNumber.split('-')[0] ?? '',
    colors: card.colors.map((c) => c.name),
    imageUrl: activeVariant.imageUrl,
    cardmarketId: activeVariant.cardmarketId,
    priceEur: toPriceEurSummary(
      pickVariantDisplayPrice(activeVariant.prices, activeVariant)
    ),
    printings: expanded.map((printing) => {
      const source =
        groupVariants.find((v) => v.variantNumber === printing.variantNumber) ??
        activeVariant;
      const display = pickVariantDisplayPrice(source.prices, {
        variantNumber: printing.variantNumber,
        variantLabel: printing.variantLabel,
        variantType: printing.isFoil ? 'Foil' : source.variantType,
        foilMode: printing.isFoil ? 'foil_only' : printing.foilMode,
      });
      const finishPrice =
        source.prices.find(
          (row) => row.isFoil === printing.isFoil && row.market != null
        ) ??
        source.prices.find((row) => row.isFoil === printing.isFoil) ??
        display;
      return {
        ...printing,
        priceEur: toPriceEurSummary(finishPrice),
        owned: ownedQuantityForPrinting(collectionByVariant, printing),
      } satisfies CardListPrinting & { owned: number };
    }),
    isBanned: isCardBannedAt(card.banEffectiveDate),
  };
}
