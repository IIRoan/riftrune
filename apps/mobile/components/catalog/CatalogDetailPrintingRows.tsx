import { View } from 'react-native';
import type { CardListPrinting } from '@riftbound/contracts';
import { OwnershipStepper } from '@/components/catalog/OwnershipStepper';
import { TrendTag } from '@/components/catalog/TrendTag';
import { Text } from '@/components/ui/text';
import { collectionFinishKey } from '@riftbound/contracts';
import type { CollectionOwnershipMap } from '@/utils/collectionOwnership';
import { formatMarketTrend, formatPrintingPrice, ownedQuantityForPrinting } from '@/utils/variants';

interface CatalogDetailPrintingRowsProps {
  printings: CardListPrinting[];
  cardName: string;
  hideCollectionActions: boolean;
  collectionByVariant: CollectionOwnershipMap;
  onAdd: (variantNumber: string, isFoil: boolean) => void;
  onRemove: (variantNumber: string, isFoil: boolean, qty: number) => void;
}

export function CatalogDetailPrintingRows({
  printings,
  cardName,
  hideCollectionActions,
  collectionByVariant,
  onAdd,
  onRemove,
}: CatalogDetailPrintingRowsProps) {
  if (printings.length === 0) return null;

  return (
    <View className="bg-card-panel">
      {printings.map((printing, index) => {
        const qty = ownedQuantityForPrinting(collectionByVariant, printing);
        return (
          <View key={collectionFinishKey(printing.variantNumber, printing.isFoil)}>
            {index > 0 ? <View className="h-hairline bg-border" /> : null}
            <View className="flex-row items-start justify-between gap-3 p-3">
              <View className="min-w-0 shrink flex-1" style={{ flexBasis: 0 }}>
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text
                    className="shrink text-sm font-semibold text-foreground"
                    numberOfLines={2}
                  >
                    {printing.variantLabel}
                  </Text>
                </View>
                <Text
                  className="font-mono text-[11px] text-archive-subtle"
                  numberOfLines={1}
                >
                  {printing.variantNumber}
                </Text>
                <View className="mt-1 flex-row flex-wrap items-center gap-2">
                  <Text className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                    {formatPrintingPrice(printing.priceEur) ?? '—'}
                  </Text>
                  <TrendTag trend={formatMarketTrend(printing.priceEur)} />
                </View>
              </View>
              <View className="shrink-0 self-center">
                {!hideCollectionActions ? (
                  <OwnershipStepper
                    owned={qty}
                    name={`${cardName} ${printing.variantLabel}`}
                    compact
                    printings={[printing]}
                    fixedVariantNumber={printing.variantNumber}
                    fixedIsFoil={printing.isFoil}
                    onAdd={() => {
                      onAdd(printing.variantNumber, printing.isFoil);
                    }}
                    onRemove={() => {
                      if (qty <= 0) return;
                      onRemove(printing.variantNumber, printing.isFoil, qty);
                    }}
                  />
                ) : qty > 0 ? (
                  <Text className="font-mono text-xs tabular-nums text-muted-foreground">
                    Own {qty}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
