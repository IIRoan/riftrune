import { View } from 'react-native';
import { EnergyPip, MightIcon } from '@/components/riftbound/CardIcons';
import { CatalogDetailMetaPill, CatalogDetailStat } from '@/components/catalog/CatalogDetailMetaParts';
import { CatalogDetailPrintingRows } from '@/components/catalog/CatalogDetailPrintingRows';
import { CardTag } from '@/components/riftbound/CardDetailParts';
import { DomainIcon, RarityIcon, TypeIcon } from '@/components/riftbound/CardIcons';
import { Text } from '@/components/ui/text';
import { formatStat } from '@/utils/cardFormat';
import type { CardListPrinting } from '@riftbound/contracts';
import type { CollectionOwnershipMap } from '@/utils/collectionOwnership';

interface CatalogDetailCollectionStatsProps {
  printings: CardListPrinting[];
  cardName: string;
  hideCollectionActions: boolean;
  collectionByVariant: CollectionOwnershipMap;
  energy: number | null | undefined;
  might: number | null | undefined;
  power: number | null | undefined;
  cardType: string;
  colors: { id: string; name: string; imageUrl?: string }[];
  activeRarity: string;
  tags: string[];
  isMobile: boolean;
  onAddPrinting: (variantNumber: string, isFoil: boolean) => void;
  onRemovePrinting: (variantNumber: string, isFoil: boolean, qty: number) => void;
}

export function buildCatalogDetailCollectionSections({
  printings,
  cardName,
  hideCollectionActions,
  collectionByVariant,
  energy,
  might,
  power,
  cardType,
  colors,
  activeRarity,
  tags,
  isMobile,
  onAddPrinting,
  onRemovePrinting,
}: CatalogDetailCollectionStatsProps) {
  const printingCollectionRows =
    printings.length > 0 ? (
      <CatalogDetailPrintingRows
        printings={printings}
        cardName={cardName}
        hideCollectionActions={hideCollectionActions}
        collectionByVariant={collectionByVariant}
        onAdd={onAddPrinting}
        onRemove={onRemovePrinting}
      />
    ) : null;

  const collectionAndStats = (
    <View className="overflow-hidden rounded-xl border border-border">
      {printingCollectionRows ? (
        <>
          {printingCollectionRows}
          <View className="h-hairline bg-border" />
        </>
      ) : null}
      <View className="flex-row bg-card">
        <CatalogDetailStat label="Cost">
          <EnergyPip value={energy ?? 0} size={22} />
        </CatalogDetailStat>
        <View className="w-hairline bg-border" />
        <CatalogDetailStat label="Might">
          <View className="flex-row items-center gap-1">
            <MightIcon size={14} />
            <Text className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatStat(might ?? 0)}
            </Text>
          </View>
        </CatalogDetailStat>
        <View className="w-hairline bg-border" />
        <CatalogDetailStat label="Power">
          <Text className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatStat(power ?? 0)}
          </Text>
        </CatalogDetailStat>
      </View>
    </View>
  );

  const desktopMetaPills = isMobile ? null : (
    <View className="flex-row flex-wrap gap-x-4 gap-y-3 rounded-xl border border-archive-soft-line p-3">
      <CatalogDetailMetaPill label="Type" icon={<TypeIcon type={cardType} size={16} />}>
        <Text className="text-sm font-semibold text-foreground">{cardType}</Text>
      </CatalogDetailMetaPill>
      <CatalogDetailMetaPill label="Domain">
        {colors.length > 0 ? (
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            {colors.map((color) => (
              <View key={color.id} className="flex-row items-center gap-1">
                <DomainIcon name={color.name} imageUrl={color.imageUrl} size={16} />
                <Text className="text-sm font-semibold text-foreground">{color.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-sm font-semibold text-foreground">—</Text>
        )}
      </CatalogDetailMetaPill>
      <CatalogDetailMetaPill
        label="Rarity"
        icon={<RarityIcon rarity={activeRarity} size={16} />}
      >
        <Text className="text-sm font-semibold text-foreground">{activeRarity}</Text>
      </CatalogDetailMetaPill>
      {tags.length > 0 ? (
        <CatalogDetailMetaPill label="Tags">
          <View className="flex-row flex-wrap gap-1">
            {tags.map((tag) => (
              <CardTag key={tag} label={tag} />
            ))}
          </View>
        </CatalogDetailMetaPill>
      ) : null}
    </View>
  );

  return { collectionAndStats, desktopMetaPills };
}
