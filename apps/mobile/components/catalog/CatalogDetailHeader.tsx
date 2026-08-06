import { View } from 'react-native';
import { Pressable as GesturePressable } from 'react-native-gesture-handler';
import { CardArtImage } from '@/components/cards/CardArtImage';
import { CardBannedOverlay } from '@/components/riftbound/CardBannedOverlay';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { CardTag } from '@/components/riftbound/CardDetailParts';
import { DomainIcon, RarityIcon, TypeIcon } from '@/components/riftbound/CardIcons';
import { Text } from '@/components/ui/text';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { cn } from '@/lib/utils';

interface CatalogDetailHeaderProps {
  cardName: string;
  isBanned: boolean;
  setCode: string;
  isMobile: boolean;
  isDrawer: boolean;
  detailImageUri: string | null;
  activeVariantNumber: string;
  activeRarity: string;
  cardType: string;
  colors: { id: string; name: string; imageUrl?: string }[];
  tags: string[];
  watchedElsewhereCount: number;
  variantFamilySwitcher: React.ReactNode;
  onOpenFullscreen: () => void;
}

export function CatalogDetailHeader({
  cardName,
  isBanned,
  setCode,
  isMobile,
  isDrawer,
  detailImageUri,
  activeVariantNumber,
  activeRarity,
  cardType,
  colors,
  tags,
  watchedElsewhereCount,
  variantFamilySwitcher,
  onOpenFullscreen,
}: CatalogDetailHeaderProps) {
  const identityMeta = (
    <View className="flex-row flex-wrap items-center gap-x-1.5 gap-y-1">
      <TypeIcon type={cardType} size={14} />
      <Text className="text-xs font-medium text-muted-foreground">{cardType}</Text>
      {colors.length > 0
        ? colors.map((color) => (
            <View key={color.id} className="flex-row items-center gap-x-1">
              <Text className="text-xs text-muted-foreground">·</Text>
              <DomainIcon name={color.name} imageUrl={color.imageUrl} size={14} />
              <Text className="text-xs font-medium text-muted-foreground">{color.name}</Text>
            </View>
          ))
        : null}
      <Text className="text-xs text-muted-foreground">·</Text>
      <RarityIcon rarity={activeRarity} size={14} />
      <Text className="text-xs font-medium text-muted-foreground">{activeRarity}</Text>
    </View>
  );

  return (
    <>
      <View className={cn('flex-row gap-3 p-3', !isDrawer && 'bg-card-panel')}>
        <GesturePressable
          className="shrink-0 active:opacity-90 web:cursor-pointer"
          onPress={onOpenFullscreen}
          accessibilityRole="button"
          accessibilityLabel={`View ${cardName} full size`}
        >
          <View
            className={cn(
              'relative aspect-[5/7] w-[128px] overflow-hidden border',
              isBanned ? 'border-destructive/70' : 'border-white/10',
              CARD_ART_RADIUS_CLASS
            )}
          >
            <CardArtImage
              uri={detailImageUri}
              recyclingKey={activeVariantNumber}
              className="absolute inset-0"
              contentFit="contain"
              contentPosition="center"
              transition={isDrawer ? 0 : 200}
            />
            {isBanned ? <CardBannedOverlay /> : null}
          </View>
          <Text className="mt-1 text-center font-mono text-[10px] text-archive-subtle">
            {activeVariantNumber}
          </Text>
        </GesturePressable>

        <View className="min-w-0 flex-1 justify-center gap-1.5">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text
              className="text-xl font-semibold leading-tight tracking-tight text-foreground"
              numberOfLines={2}
            >
              {cardName}
            </Text>
            {isBanned ? <StatusKeywordBadge status="illegal" /> : null}
          </View>
          {isBanned ? (
            <Text className="text-xs text-destructive">Banned in tournament play.</Text>
          ) : null}
          {isMobile ? (
            <>
              <Text className="font-mono text-xs text-muted-foreground">{setCode}</Text>
              {identityMeta}
              {tags.length > 0 ? (
                <View className="flex-row flex-wrap gap-1">
                  {tags.map((tag) => (
                    <CardTag key={tag} label={tag} />
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <View className="flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <Text className="font-mono text-xs text-muted-foreground">{setCode}</Text>
              <Text className="text-xs text-muted-foreground">·</Text>
              <RarityIcon rarity={activeRarity} size={14} />
              <Text className="text-xs font-medium text-muted-foreground">{activeRarity}</Text>
            </View>
          )}
          {watchedElsewhereCount > 0 ? (
            <Text className="text-xs font-medium text-primary">
              Also on wishlist: {watchedElsewhereCount} other printing
              {watchedElsewhereCount === 1 ? '' : 's'}
            </Text>
          ) : null}
          {!isDrawer ? variantFamilySwitcher : null}
        </View>
      </View>

      {isDrawer && variantFamilySwitcher ? (
        <View className="gap-2 px-3 pb-1 pt-0">{variantFamilySwitcher}</View>
      ) : null}
    </>
  );
}
