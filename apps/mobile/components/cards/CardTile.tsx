import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import type { CardListItem } from '@riftbound/contracts';
import { OwnershipStepper } from '@/components/catalog/OwnershipStepper';
import { TrendTag } from '@/components/catalog/TrendTag';
import { Text } from '@/components/ui/text';
import { rarityIconFor } from '@/constants/gameAssets';
import { useCollectionMutations } from '@/hooks/useCollection';
import type { CollectionEntry } from '@/services/collectionService';
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
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const LIST_THUMB_W = 56;
const LIST_THUMB_H = 78;
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
  /** When set, quick-add popover only offers std/foil for this printing family. */
  familyContextVariantNumber?: string | null;
  /** Hide market price (e.g. search results — only the selected row shows a price). */
  hidePrice?: boolean;
  onPress?: () => void;
  collectionByVariant?: ReadonlyMap<string, CollectionEntry>;
}

export function CardTile({
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
  collectionByVariant,
}: Props) {
  const router = useRouter();
  const { addCard, setQuantity } = useCollectionMutations();
  const [busy, setBusy] = useState(false);

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

  const printings = stepperPrintings;
  const scopedCard = useMemo(
    () => ({ ...card, printings: stepperPrintings }),
    [card, stepperPrintings]
  );
  const printingsLabel = printingSummary(scopedCard);
  const multiplePrintings = hasMultiplePrintings(printings);
  const primaryPrinting = printings[0];
  const owned = useMemo(
    () => totalOwnedForCard(scopedCard, collectionByVariant),
    [scopedCard, collectionByVariant]
  );
  const priceLabel = formatListPrice(scopedCard);

  const printingsWithOwned = useMemo(
    () =>
      printings.map((p) => ({
        ...p,
        owned: collectionByVariant?.get(p.variantNumber)?.quantity ?? 0,
      })),
    [printings, collectionByVariant]
  );

  const onOpenCard = useCallback(() => {
    if (onPress) {
      void hapticPress();
      onPress();
      return;
    }
    void hapticPress();
    openCard(router, card.variantNumber, 'modal');
  }, [router, card.variantNumber, onPress]);

  const onAdd = useCallback(
    async (variantNumber?: string) => {
      await hapticPress();
      setBusy(true);
      try {
        await addCard.mutateAsync({ card, variantNumber });
      } finally {
        setBusy(false);
      }
    },
    [addCard, card]
  );

  const onRemove = useCallback(
    async (variantNumber?: string) => {
      await hapticPress();
      const vn = variantNumber ?? primaryPrinting?.variantNumber;
      if (!vn) return;
      const entry = collectionByVariant?.get(vn);
      if (!entry) return;
      setBusy(true);
      try {
        await setQuantity.mutateAsync({
          variantNumber: vn,
          quantity: Math.max(0, entry.quantity - 1),
        });
      } finally {
        setBusy(false);
      }
    },
    [collectionByVariant, primaryPrinting?.variantNumber, setQuantity]
  );

  const stepper = enableQuickAdd ? (
    <OwnershipStepper
      owned={owned}
      name={card.name}
      compact={layout === 'grid' || compact}
      busy={busy}
      printings={printingsWithOwned}
      onAdd={(vn) => {
        void onAdd(vn);
      }}
      onRemove={(vn) => {
        void onRemove(vn);
      }}
    />
  ) : null;

  if (layout === 'list') {
    return (
      <Pressable
        className={cn(
          'flex-row items-center gap-4 px-4 py-3.5 active:opacity-90',
          selected ? 'bg-card-panel' : 'active:bg-card-panel/50'
        )}
        style={style}
        onPress={onOpenCard}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <View
          className={cn(
            'overflow-hidden rounded-md bg-background',
            selected ? 'border-2 border-ring' : 'border border-white/10'
          )}
          style={{ width: LIST_THUMB_W, height: LIST_THUMB_H }}
        >
          <Image
            source={{ uri: card.imageUrl }}
            className="size-full"
            contentFit="cover"
            contentPosition="top"
            transition={120}
            cachePolicy="memory-disk"
          />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-baseline gap-2">
            <Text className="flex-1 text-[15px] font-semibold text-foreground" numberOfLines={1}>
              {card.name}
            </Text>
            <Text className="hidden font-mono text-xs text-muted-foreground sm:flex">
              {primaryPrinting?.variantNumber}
            </Text>
          </View>
          <View className="mt-1 flex-row items-center gap-1.5">
            {rarityIconFor(card.rarity) ? (
              <Image
                source={rarityIconFor(card.rarity)!}
                className="size-4 shrink-0"
                contentFit="contain"
              />
            ) : null}
            <Text className="min-w-0 flex-1 text-[13px] text-muted-foreground" numberOfLines={1}>
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
          <View className="mt-1.5 flex-row items-center gap-1.5">
            {owned > 0 ? (
              <>
                <View className="size-1.5 rounded-full bg-success" />
                <Text className="text-xs font-medium text-success">Owned ×{owned}</Text>
                {printingsLabel ? (
                  <Text className="text-xs text-muted-foreground">· {printingsLabel}</Text>
                ) : null}
              </>
            ) : (
              <>
                <View className="size-1.5 rounded-full border border-muted-foreground" />
                <Text className="text-xs font-medium text-muted-foreground">Wishlist</Text>
                {printingsLabel ? (
                  <Text className="text-xs text-muted-foreground">· {printingsLabel}</Text>
                ) : null}
              </>
            )}
          </View>
        </View>

        <View
          className="items-end gap-2"
          onStartShouldSetResponder={() => true}
        >
          {!hidePrice ? (
            <View className="items-end gap-0.5">
              {printings.map((p) => (
                <View key={p.variantNumber} className="flex-row items-center gap-1.5">
                  {multiplePrintings ? (
                    <Text className="font-mono text-[10px] text-muted-foreground">
                      {p.isFoil ? 'Foil' : 'Std'}
                    </Text>
                  ) : null}
                  <Text className="font-mono text-sm font-semibold tabular-nums text-foreground">
                    {formatPrintingPrice(p.priceEur) ?? '—'}
                  </Text>
                  <TrendTag trend={formatMarketTrend(p.priceEur)} />
                </View>
              ))}
            </View>
          ) : null}
          {stepper}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      className={cn(
        'rounded-xl border p-2 active:opacity-90',
        selected ? 'border-ring bg-card-panel' : 'border-border bg-card active:border-muted-foreground'
      )}
      style={style}
      onPress={onOpenCard}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View className="relative aspect-[5/7] overflow-hidden rounded-lg bg-background ring-1 ring-white/10">
        <Image
          source={{ uri: card.imageUrl }}
          className="size-full"
          contentFit="cover"
          contentPosition="top"
          transition={120}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />
      </View>

      <Text className="mt-2 truncate px-0.5 text-[13px] font-semibold text-foreground" numberOfLines={1}>
        {card.name}
      </Text>
      <Text className="px-0.5 font-mono text-[11px] text-muted-foreground">
        {primaryPrinting?.variantNumber}
      </Text>

      <View
        className="mt-2 flex-row items-center justify-between gap-1.5 px-0.5"
        // Keep add/stepper taps from opening the card detail row.
        onStartShouldSetResponder={() => true}
      >
        {!hidePrice ? (
          <Text className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
            {priceLabel ?? '—'}
          </Text>
        ) : (
          <View className="min-w-0 flex-1" />
        )}
        {stepper}
      </View>
    </Pressable>
  );
}

export function CardTileSkeleton({
  layout = 'grid',
  compact = false,
}: {
  layout?: 'grid' | 'list';
  compact?: boolean;
}) {
  if (layout === 'list') {
    return (
      <View className="flex-row items-center gap-4 px-4 py-3.5 opacity-40">
        <Skeleton className="rounded-md" style={{ width: LIST_THUMB_W, height: LIST_THUMB_H }} />
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
        className={cn('w-full rounded-lg', compact && 'rounded')}
        style={{ aspectRatio: 5 / 7 }}
      />
      <Skeleton className="h-2.5 w-[85%] rounded" />
      <Skeleton className="h-2 w-[50%] rounded" />
    </View>
  );
}
