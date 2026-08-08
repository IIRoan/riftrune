import { Image } from 'expo-image';
import { Pressable, View, type ViewStyle } from 'react-native';
import type { CardListItem, CardListPrinting } from '@riftbound/contracts';
import { CardArtImage } from '@/components/cards/CardArtImage';
import { CardBannedOverlay } from '@/components/riftbound/CardBannedOverlay';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { TrendTag } from '@/components/catalog/TrendTag';
import { Text } from '@/components/ui/text';
import { rarityIconFor } from '@/constants/gameAssets';
import { CARD_ART_RADIUS_CLASS, CATALOG_ART_THUMB_WIDTH } from '@/constants/CardArt';
import { formatPrintingPrice, formatMarketTrend } from '@/utils/variants';
import { cn } from '@/lib/utils';

const PREMIUM_RARITIES = ['Rare', 'Epic', 'Showcase'];

export interface CardTileListLayoutProps {
  card: CardListItem;
  style?: ViewStyle;
  listCompact: boolean;
  listThumbW: number;
  listThumbH: number;
  imageUri: string | null;
  banned: boolean;
  selected: boolean;
  artInstant: boolean;
  primaryPrinting?: CardListItem['printings'][number];
  owned: number;
  printingsLabel: string | null;
  showPrice: boolean;
  pricePrintings: CardListPrinting[];
  multiplePricePrintings: boolean;
  listStepper: React.ReactNode;
  onOpenCard: () => void;
}

export function CardTileListLayout({
  card,
  style,
  listCompact,
  listThumbW,
  listThumbH,
  imageUri,
  banned,
  selected,
  artInstant,
  primaryPrinting,
  owned,
  printingsLabel,
  showPrice,
  pricePrintings,
  multiplePricePrintings,
  listStepper,
  onOpenCard,
}: CardTileListLayoutProps) {
  return (
    <Pressable
      className={cn(
        'flex-row items-center active:opacity-90',
        listCompact ? 'gap-3 px-3 py-2.5' : 'gap-4 px-4 py-3.5',
        selected ? 'bg-card-panel' : 'active:bg-card-panel/50'
      )}
      style={style}
      onPress={onOpenCard}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View className="relative shrink-0">
        <CardArtImage
          uri={imageUri}
          recyclingKey={card.variantNumber}
          style={{ width: listThumbW, height: listThumbH }}
          className={cn(
            CARD_ART_RADIUS_CLASS,
            banned
              ? 'border-2 border-destructive/70'
              : selected
                ? 'border-2 border-ring'
                : 'border border-white/10'
          )}
          contentFit="cover"
          contentPosition="top"
          instant={artInstant}
          thumbWidth={CATALOG_ART_THUMB_WIDTH}
          progressive
        />
        {banned ? <CardBannedOverlay className="left-0.5 top-0.5" /> : null}
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-baseline gap-2">
          <Text
            className={cn(
              'flex-1 font-semibold text-foreground',
              listCompact ? 'text-[14px]' : 'text-[15px]'
            )}
            numberOfLines={1}
          >
            {card.name}
          </Text>
          {banned ? <StatusKeywordBadge status="illegal" compact /> : null}
          <Text className="hidden font-mono text-xs text-muted-foreground sm:flex">
            {primaryPrinting?.variantNumber}
          </Text>
        </View>
        <View
          className={cn('flex-row items-center gap-1.5', listCompact ? 'mt-0.5' : 'mt-1')}
        >
          {rarityIconFor(card.rarity) ? (
            <Image
              source={rarityIconFor(card.rarity)!}
              style={{ width: listCompact ? 14 : 16, height: listCompact ? 14 : 16 }}
              className="shrink-0"
              contentFit="contain"
            />
          ) : null}
          <Text
            className={cn(
              'min-w-0 flex-1 text-muted-foreground',
              listCompact ? 'text-[12px]' : 'text-[13px]'
            )}
            numberOfLines={1}
          >
            <Text
              className={cn(
                PREMIUM_RARITIES.includes(card.rarity) && 'font-semibold text-foreground'
              )}
            >
              {card.rarity}
            </Text>
            {card.colors.length > 0 ? ` · ${card.colors.join(' / ')}` : ''}
            {card.setCode ? ` · ${card.setCode}` : ''}
          </Text>
        </View>
        <View
          className={cn('flex-row items-center gap-1.5', listCompact ? 'mt-1' : 'mt-1.5')}
        >
          {owned > 0 ? (
            <>
              <View className="size-1.5 rounded-full bg-success" />
              <Text
                className={cn(
                  'font-medium text-success',
                  listCompact ? 'text-[11px]' : 'text-xs'
                )}
              >
                Owned ×{owned}
              </Text>
              {printingsLabel ? (
                <Text
                  className={cn(
                    'text-muted-foreground',
                    listCompact ? 'text-[11px]' : 'text-xs'
                  )}
                >
                  · {printingsLabel}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <View className="size-1.5 rounded-full border border-muted-foreground" />
              <Text
                className={cn(
                  'font-medium text-muted-foreground',
                  listCompact ? 'text-[11px]' : 'text-xs'
                )}
              >
                Not owned
              </Text>
              {printingsLabel ? (
                <Text
                  className={cn(
                    'text-muted-foreground',
                    listCompact ? 'text-[11px]' : 'text-xs'
                  )}
                >
                  · {printingsLabel}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </View>

      <View className={cn('items-end', listCompact ? 'gap-1.5' : 'gap-2')}>
        {showPrice ? (
          <View className="items-end gap-0.5">
            {pricePrintings.map((p) => (
              <View key={p.variantNumber} className="flex-row items-center gap-1.5">
                {multiplePricePrintings ? (
                  <Text className="font-mono text-[10px] text-muted-foreground">
                    {p.isFoil ? 'Foil' : 'Std'}
                  </Text>
                ) : null}
                <Text
                  className={cn(
                    'font-mono font-semibold tabular-nums text-foreground',
                    listCompact ? 'text-[13px]' : 'text-sm'
                  )}
                >
                  {formatPrintingPrice(p.priceEur) ?? '—'}
                </Text>
                <TrendTag trend={formatMarketTrend(p.priceEur)} />
              </View>
            ))}
          </View>
        ) : null}
        {listStepper}
      </View>
    </Pressable>
  );
}
