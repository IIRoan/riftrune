import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { Keyboard, Pressable, View, type ViewStyle } from 'react-native';
import type { CardListItem } from '@riftbound/contracts';
import { CardArtImage } from '@/components/cards/CardArtImage';
import { CardBannedOverlay } from '@/components/riftbound/CardBannedOverlay';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { OwnershipStepper } from '@/components/catalog/OwnershipStepper';
import { TrendTag } from '@/components/catalog/TrendTag';
import { GridCollectionControl } from '@/components/collection/GridCollectionControl';
import { Text } from '@/components/ui/text';
import { rarityIconFor } from '@/constants/gameAssets';
import { gridCardTitleStyle } from '@/lib/cardTileGridTitle';
import { useCollectionMutations } from '@/hooks/useCollection';
import { useOwnershipMap } from '@/hooks/useOwnershipMap';
import type { CollectionOwnershipMap } from '@/utils/collectionOwnership';
import { openCard } from '@/utils/cardNavigation';
import {
  formatListPrice,
  formatMarketTrend,
  formatPrintingPrice,
  getCardPrintings,
  getPrintingsInSearchGroup,
  getVariantFamiliesFromPrintings,
  hasMultiplePrintings,
  printingSummary,
  totalOwnedForCard,
} from '@/utils/variants';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import { hapticPress } from '@/utils/haptics';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { cn } from '@/lib/utils';
import { isListItemBanned } from '@/lib/card-legality';
import { Skeleton } from '@/components/ui/skeleton';

const LIST_THUMB_W = 56;
const LIST_THUMB_H = 78;
const LIST_THUMB_W_MOBILE = 44;
const LIST_THUMB_H_MOBILE = 62;
const PREMIUM_RARITIES = ['Rare', 'Epic', 'Showcase'];

export type CardTileMode = 'search' | 'collection';

interface Props {
  card: CardListItem;
  layout?: 'grid' | 'list';
  mode?: CardTileMode;
  style?: ViewStyle;
  compact?: boolean;
  enableQuickAdd?: boolean;
  selected?: boolean;
  familyContextVariantNumber?: string | null;
  hidePrice?: boolean;
  onPress?: () => void;
  collectionByVariant?: CollectionOwnershipMap;
}

function CardTileInner({
  card,
  layout = 'grid',
  mode: _mode = 'search',
  style,
  compact = false,
  enableQuickAdd = false,
  selected = false,
  familyContextVariantNumber,
  hidePrice = false,
  onPress,
  collectionByVariant: collectionByVariantProp,
}: Props) {
  const router = useRouter();
  const isMobile = useMobileLayout();
  const ownershipFromStore = useOwnershipMap();
  const collectionByVariant = collectionByVariantProp ?? ownershipFromStore;
  const { addCard, setQuantity } = useCollectionMutations();

  const allPrintings = getCardPrintings(card);
  const variantFamilies = useMemo(
    () => getVariantFamiliesFromPrintings(allPrintings),
    [allPrintings]
  );
  const stepperPrintings = useMemo(() => {
    if (familyContextVariantNumber) {
      return getPrintingsInSearchGroup(allPrintings, familyContextVariantNumber);
    }
    return variantFamilies[0]?.variants ?? allPrintings;
  }, [allPrintings, familyContextVariantNumber, variantFamilies]);

  const pricePrintings = familyContextVariantNumber ? stepperPrintings : allPrintings;
  const printings = stepperPrintings;
  const multiplePricePrintings = hasMultiplePrintings(pricePrintings);
  const scopedCard = useMemo(
    () => ({ ...card, printings: pricePrintings }),
    [card, pricePrintings]
  );
  const printingsLabel = printingSummary(scopedCard);
  const multiplePrintings = hasMultiplePrintings(printings);
  const primaryPrinting = printings[0];
  const owned = useMemo(
    () => totalOwnedForCard(scopedCard, collectionByVariant),
    [scopedCard, collectionByVariant]
  );
  const priceLabel = formatListPrice(scopedCard);
  const showPrice = !hidePrice && (!isMobile || layout === 'grid');

  const printingsWithOwned = useMemo(
    () =>
      printings.map((p) => ({
        ...p,
        owned: collectionByVariant?.get(p.variantNumber)?.quantity ?? 0,
      })),
    [printings, collectionByVariant]
  );

  const onOpenCard = useCallback(() => {
    Keyboard.dismiss();
    if (onPress) {
      void hapticPress();
      onPress();
      return;
    }
    void hapticPress();
    openCard(router, card.variantNumber, 'modal');
  }, [router, card.variantNumber, onPress]);

  const onAdd = useCallback(
    (variantNumber?: string) => {
      void hapticPress();
      addCard.mutate({ card, variantNumber });
    },
    [addCard, card]
  );

  const onRemove = useCallback(
    (variantNumber?: string) => {
      void hapticPress();
      const vn = variantNumber ?? primaryPrinting?.variantNumber;
      if (!vn) return;
      const entry = collectionByVariant?.get(vn);
      if (!entry) return;
      setQuantity.mutate({
        variantNumber: vn,
        quantity: Math.max(0, entry.quantity - 1),
      });
    },
    [collectionByVariant, primaryPrinting?.variantNumber, setQuantity]
  );

  const listCompact = isMobile && layout === 'list';
  const listThumbW = listCompact ? LIST_THUMB_W_MOBILE : LIST_THUMB_W;
  const listThumbH = listCompact ? LIST_THUMB_H_MOBILE : LIST_THUMB_H;
  const mobileGridQuickAdd = isMobile && layout === 'grid' && enableQuickAdd;
  const stepperCompact = compact && !listCompact;
  const stepperRelaxed = listCompact && enableQuickAdd;

  const collectionCallbacks = {
    onAdd: (vn?: string) => {
      void onAdd(vn);
    },
    onRemove: (vn?: string) => {
      void onRemove(vn);
    },
  };

  const desktopGridStepper = enableQuickAdd && layout === 'grid' && !isMobile;
  const desktopStepper = enableQuickAdd && !mobileGridQuickAdd ? (
    <OwnershipStepper
      owned={owned}
      name={card.name}
      compact={stepperCompact}
      relaxed={stepperRelaxed}
      gridSlot={desktopGridStepper}
      printings={printingsWithOwned}
      {...collectionCallbacks}
    />
  ) : null;

  const gridControl = mobileGridQuickAdd ? (
    <GridCollectionControl
      owned={owned}
      name={card.name}
      printings={printingsWithOwned}
      {...collectionCallbacks}
    />
  ) : null;

  const imageUri = resolveImageUrl(card.imageUrl);
  const banned = isListItemBanned(card);

  if (layout === 'list') {
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
            instant={_mode === 'search'}
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
          <View className={cn('flex-row items-center gap-1.5', listCompact ? 'mt-0.5' : 'mt-1')}>
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
          <View className={cn('flex-row items-center gap-1.5', listCompact ? 'mt-1' : 'mt-1.5')}>
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
          {desktopStepper}
        </View>
      </Pressable>
    );
  }

  if (mobileGridQuickAdd) {
    return (
      <View
        className={cn(
          'overflow-hidden rounded-lg border',
          banned
            ? 'border-destructive/70'
            : selected
              ? 'border-ring bg-card-panel'
              : 'border-border bg-card'
        )}
        style={style}
      >
        <Pressable className="active:opacity-90" onPress={onOpenCard}>
          <View
            className={cn(
              'relative aspect-[5/7] w-full overflow-hidden',
              CARD_ART_RADIUS_CLASS
            )}
          >
            <CardArtImage
              uri={imageUri}
              recyclingKey={card.variantNumber}
              className="absolute inset-0"
              contentFit="cover"
              contentPosition="top"
              instant
            />
            {banned ? <CardBannedOverlay /> : null}
          </View>
          <Text
            className="mt-1 px-1 font-semibold text-foreground"
            ellipsizeMode="tail"
            numberOfLines={2}
            style={gridCardTitleStyle()}
          >
            {card.name}
          </Text>
          <View className="min-w-0 flex-row items-center justify-between gap-1 px-1 pb-0.5">
            <Text
              className="min-w-0 shrink font-mono text-[10px] text-muted-foreground"
              numberOfLines={1}
            >
              {primaryPrinting?.variantNumber}
            </Text>
            {showPrice ? (
              <Text
                className="shrink-0 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground"
                numberOfLines={1}
              >
                {priceLabel ?? '—'}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <View className="px-1 pb-1 pt-0">{gridControl}</View>
      </View>
    );
  }

  return (
    <Pressable
      className={cn(
        'overflow-hidden rounded-xl border p-2 active:opacity-90',
        banned
          ? 'border-destructive/70 bg-card'
          : selected
            ? 'border-ring bg-card-panel'
            : 'border-border bg-card active:border-muted-foreground'
      )}
      style={style}
      onPress={onOpenCard}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View
        className={cn(
          'relative aspect-[5/7] w-full overflow-hidden ring-1',
          banned ? 'ring-destructive/50' : 'ring-white/10',
          CARD_ART_RADIUS_CLASS
        )}
      >
        <CardArtImage
          uri={imageUri}
          recyclingKey={card.variantNumber}
          className="absolute inset-0"
          contentFit="cover"
          contentPosition="top"
          instant={_mode === 'search'}
        />
        {banned ? <CardBannedOverlay /> : null}
      </View>

      <Text className="mt-2 truncate px-0.5 text-[13px] font-semibold text-foreground" numberOfLines={1}>
        {card.name}
      </Text>
      <View className="min-w-0 flex-row items-center justify-between gap-1.5 px-0.5">
        <Text
          className="min-w-0 shrink font-mono text-[11px] text-muted-foreground"
          numberOfLines={1}
        >
          {primaryPrinting?.variantNumber}
        </Text>
        {showPrice ? (
          <Text
            className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-foreground"
            numberOfLines={1}
          >
            {priceLabel ?? '—'}
          </Text>
        ) : null}
      </View>

      {desktopStepper ? (
        <View className="mt-2 px-0.5">{desktopStepper}</View>
      ) : null}
    </Pressable>
  );
}

export const CardTile = memo(
  CardTileInner,
  (prev, next) =>
    prev.card.variantNumber === next.card.variantNumber &&
    prev.layout === next.layout &&
    prev.compact === next.compact &&
    prev.enableQuickAdd === next.enableQuickAdd &&
    prev.selected === next.selected &&
    prev.familyContextVariantNumber === next.familyContextVariantNumber &&
    prev.hidePrice === next.hidePrice &&
    prev.collectionByVariant === next.collectionByVariant &&
    prev.onPress === next.onPress &&
    prev.mode === next.mode
);

export function CardTileSkeleton({
  layout = 'grid',
  compact = false,
}: {
  layout?: 'grid' | 'list';
  compact?: boolean;
}) {
  const isMobile = useMobileLayout();
  const listCompact = isMobile && layout === 'list';
  const listThumbW = listCompact ? LIST_THUMB_W_MOBILE : LIST_THUMB_W;
  const listThumbH = listCompact ? LIST_THUMB_H_MOBILE : LIST_THUMB_H;

  if (layout === 'list') {
    return (
      <View
        className={cn(
          'flex-row items-center opacity-40',
          listCompact ? 'gap-3 px-3 py-2' : 'gap-4 px-4 py-3.5'
        )}
      >
        <Skeleton className={CARD_ART_RADIUS_CLASS} style={{ width: listThumbW, height: listThumbH }} />
        <View className="min-w-0 flex-1 gap-1.5">
          <Skeleton className="h-3 w-[65%] rounded" />
          <Skeleton className="h-2.5 w-[40%] rounded" />
          <Skeleton className="h-2 w-[30%] rounded" />
        </View>
      </View>
    );
  }

  return (
    <View className="gap-2 opacity-40">
      <Skeleton
        className={cn('w-full', CARD_ART_RADIUS_CLASS)}
        style={{ aspectRatio: 5 / 7 }}
      />
      <Skeleton className="h-2.5 w-[85%] rounded" />
      <Skeleton className="h-2 w-[50%] rounded" />
      {compact ? <Skeleton className="h-8 w-full rounded-lg" /> : null}
    </View>
  );
}
