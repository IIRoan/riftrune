import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import { useCollectionMutations } from '@/hooks/useCollection';
import { useOwnershipMap } from '@/hooks/useOwnershipMap';
import type { CollectionOwnershipMap } from '@/utils/collectionOwnership';
import { openCard } from '@/utils/cardNavigation';
import {
  formatListPrice,
  formatMarketTrend,
  formatPrintingPrice,
  hasMultiplePrintings,
  ownedQuantityForPrinting,
  printingSummary,
  totalOwnedForCard,
} from '@/utils/variants';
import {
  attachOwnedToPrintings,
  resolvePrintingSelection,
  resolveQuickAddPrintings,
  resolveQuickAddSelection,
  resolveQuickRemoveSelection,
} from '@/utils/collectionPrintingPicker';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import { hapticPress } from '@/utils/haptics';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { cn } from '@/lib/utils';
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
  /** Skip foil/standard picker on quick-add; inserts the default (non-foil) finish. */
  simpleAdd?: boolean;
  selected?: boolean;
  familyContextVariantNumber?: string | null;
  hidePrice?: boolean;
  /** Prefer this over `onPress` in virtualized lists — keeps memo() stable. */
  onSelectVariant?: (variantNumber: string) => void;
  onPress?: () => void;
  collectionByVariant?: CollectionOwnershipMap;
  /** Skip art fade/shimmer — pass from recycled list cells (search mode does this automatically). */
  instantArt?: boolean;
}

function CardTileInner({
  card,
  layout = 'grid',
  mode: _mode = 'search',
  style,
  compact = false,
  enableQuickAdd = false,
  simpleAdd = false,
  selected = false,
  familyContextVariantNumber,
  hidePrice = false,
  onSelectVariant,
  onPress,
  collectionByVariant: collectionByVariantProp,
  instantArt = false,
}: Props) {
  const router = useRouter();
  const isMobile = useMobileLayout();
  const ownershipFromStore = useOwnershipMap({
    enabled: collectionByVariantProp == null,
  });
  const collectionByVariant = collectionByVariantProp ?? ownershipFromStore;
  const { addCard, adjustQuantity } = useCollectionMutations();
  const artInstant = instantArt || _mode === 'search';

  // Scope prices + quick-add to this row's printing family. Prefer an explicit
  // family context (selected detail), otherwise the row's own variant so
  // overnumbered / alt art tiles keep their Cardmarket price.
  const stepperPrintings = useMemo(
    () =>
      resolveQuickAddPrintings(card, familyContextVariantNumber ?? card.variantNumber),
    [card, familyContextVariantNumber]
  );

  const pricePrintings = stepperPrintings;
  const printings = stepperPrintings;
  const multiplePricePrintings = hasMultiplePrintings(pricePrintings);
  const scopedCard = useMemo(
    () => ({ ...card, printings: pricePrintings }),
    [card, pricePrintings]
  );
  const printingsLabel = printingSummary(scopedCard);
  const primaryPrinting = printings[0];
  const owned = useMemo(
    () => totalOwnedForCard(scopedCard, collectionByVariant),
    [scopedCard, collectionByVariant]
  );
  // FlatList can lag a frame (or more) on prop delivery — paint the new count
  // in this tile immediately on press, then clear when server/cache props catch up.
  const [optimisticOwned, setOptimisticOwned] = useState<number | null>(null);
  useEffect(() => {
    setOptimisticOwned(null);
  }, [owned]);
  const displayOwned = optimisticOwned ?? owned;
  const priceLabel = formatListPrice(scopedCard);
  const showPrice = !hidePrice && (!isMobile || layout === 'grid');

  const printingsWithOwned = useMemo(
    () => attachOwnedToPrintings(printings, collectionByVariant),
    [printings, collectionByVariant]
  );

  const onOpenCard = useCallback(() => {
    Keyboard.dismiss();
    if (onSelectVariant) {
      void hapticPress();
      onSelectVariant(card.variantNumber);
      return;
    }
    if (onPress) {
      void hapticPress();
      onPress();
      return;
    }
    void hapticPress();
    openCard(router, card.variantNumber, 'modal');
  }, [router, card.variantNumber, onSelectVariant, onPress]);

  const onAdd = useCallback(
    (selectionId?: string) => {
      void hapticPress();
      const selection =
        resolvePrintingSelection(selectionId, printings) ??
        resolveQuickAddSelection(printings) ?? {
          variantNumber: card.variantNumber,
          isFoil: false,
        };
      setOptimisticOwned((prev) => (prev ?? owned) + 1);
      addCard.mutate({
        card,
        variantNumber: selection.variantNumber,
        isFoil: selection.isFoil,
      });
    },
    [addCard, card, owned, printings]
  );

  const onRemove = useCallback(
    (selectionId?: string) => {
      void hapticPress();
      const selection =
        resolveQuickRemoveSelection(printingsWithOwned, selectionId) ??
        resolvePrintingSelection(selectionId, printings);
      if (!selection) return;
      const current =
        ownedQuantityForPrinting(collectionByVariant, selection) ||
        (optimisticOwned ?? owned);
      if (current <= 0) return;
      setOptimisticOwned(Math.max(0, (optimisticOwned ?? owned) - 1));
      adjustQuantity.mutate({
        variantNumber: selection.variantNumber,
        delta: -1,
        isFoil: selection.isFoil,
      });
    },
    [
      collectionByVariant,
      printingsWithOwned,
      printings,
      adjustQuantity,
      owned,
      optimisticOwned,
    ]
  );

  const listCompact = isMobile && layout === 'list';
  const listThumbW = listCompact ? LIST_THUMB_W_MOBILE : LIST_THUMB_W;
  const listThumbH = listCompact ? LIST_THUMB_H_MOBILE : LIST_THUMB_H;
  const gridQuickAdd = layout === 'grid' && enableQuickAdd;
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

  const listStepper =
    enableQuickAdd && layout === 'list' ? (
      <OwnershipStepper
        owned={displayOwned}
        name={card.name}
        compact={stepperCompact}
        relaxed={stepperRelaxed}
        printings={printingsWithOwned}
        simpleAdd={simpleAdd}
        {...collectionCallbacks}
      />
    ) : null;

  const gridControl = gridQuickAdd ? (
    <GridCollectionControl
      owned={displayOwned}
      name={card.name}
      printings={printingsWithOwned}
      simpleAdd={simpleAdd}
      {...collectionCallbacks}
    />
  ) : null;

  const imageUri = resolveImageUrl(card.imageUrl);
  const banned = card.isBanned;

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
            instant={artInstant}
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
            className={cn(
              'flex-row items-center gap-1.5',
              listCompact ? 'mt-0.5' : 'mt-1'
            )}
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
                  PREMIUM_RARITIES.includes(card.rarity) &&
                    'font-semibold text-foreground'
                )}
              >
                {card.rarity}
              </Text>
              {card.colors.length > 0 ? ` · ${card.colors.join(' / ')}` : ''}
              {card.setCode ? ` · ${card.setCode}` : ''}
            </Text>
          </View>
          <View
            className={cn(
              'flex-row items-center gap-1.5',
              listCompact ? 'mt-1' : 'mt-1.5'
            )}
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

  // Grid — tray: art on top, flush theme panel with name / price / Add.
  return (
    <View
      className={cn(
        'overflow-hidden border bg-card',
        CARD_ART_RADIUS_CLASS,
        banned
          ? 'border-destructive/70'
          : selected
            ? 'border-ring'
            : 'border-border'
      )}
      style={style}
    >
      <Pressable
        className="active:opacity-95"
        onPress={onOpenCard}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={card.name}
      >
        <View className="relative aspect-[5/7] w-full overflow-hidden bg-card-panel">
          <CardArtImage
            uri={imageUri}
            recyclingKey={card.variantNumber}
            className="absolute inset-0"
            contentFit="cover"
            contentPosition="top"
            instant={artInstant || isMobile}
          />
          {banned ? <CardBannedOverlay /> : null}
        </View>
      </Pressable>

      <View className="gap-2 border-t border-border bg-card-panel px-2.5 py-2.5">
        <Pressable onPress={onOpenCard} accessibilityRole="button">
          <View className="gap-0.5">
            <Text
              className="text-[13px] font-semibold leading-4 text-foreground"
              numberOfLines={2}
            >
              {card.name}
            </Text>
            <View className="flex-row items-center justify-between gap-2">
              {showPrice ? (
                <Text className="font-mono text-[12px] font-semibold tabular-nums text-foreground">
                  {priceLabel ?? '—'}
                </Text>
              ) : (
                <View />
              )}
              <Text
                className="font-mono text-[10px] text-muted-foreground"
                numberOfLines={1}
              >
                {primaryPrinting?.variantNumber}
              </Text>
            </View>
          </View>
        </Pressable>
        {gridControl}
      </View>
    </View>
  );
}

export const CardTile = memo(
  CardTileInner,
  (prev, next) =>
    prev.card.variantNumber === next.card.variantNumber &&
    prev.card.priceEur?.market === next.card.priceEur?.market &&
    prev.layout === next.layout &&
    prev.compact === next.compact &&
    prev.enableQuickAdd === next.enableQuickAdd &&
    prev.simpleAdd === next.simpleAdd &&
    prev.selected === next.selected &&
    prev.familyContextVariantNumber === next.familyContextVariantNumber &&
    prev.hidePrice === next.hidePrice &&
    prev.collectionByVariant === next.collectionByVariant &&
    prev.onSelectVariant === next.onSelectVariant &&
    prev.onPress === next.onPress &&
    prev.mode === next.mode &&
    prev.instantArt === next.instantArt
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
        <Skeleton
          className={CARD_ART_RADIUS_CLASS}
          style={{ width: listThumbW, height: listThumbH }}
        />
        <View className="min-w-0 flex-1 gap-1.5">
          <Skeleton className="h-3 w-[65%] rounded" />
          <Skeleton className="h-2.5 w-[40%] rounded" />
          <Skeleton className="h-2 w-[30%] rounded" />
        </View>
      </View>
    );
  }

  return (
    <View
      className={cn(
        'overflow-hidden border border-border bg-card opacity-40',
        CARD_ART_RADIUS_CLASS
      )}
    >
      <Skeleton className="w-full rounded-none" style={{ aspectRatio: 5 / 7 }} />
      <View className="gap-2 border-t border-border bg-card-panel px-2.5 py-2.5">
        <Skeleton className="h-3 w-[80%] rounded" />
        <Skeleton className="h-2.5 w-[45%] rounded" />
        <Skeleton className="h-9 w-full rounded-full" />
      </View>
    </View>
  );
}
