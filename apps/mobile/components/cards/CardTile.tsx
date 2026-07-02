import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';
import type { CardListItem } from '@riftbound/contracts';
import { Button, ButtonIcon } from '@/components/ui/button';
import { VariantPickerSheet } from '@/components/ui/VariantPickerSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useCollectionMutations } from '@/hooks/useCollection';
import type { CollectionEntry } from '@/services/collectionService';
import { openCard } from '@/utils/cardNavigation';
import {
  formatListPrice,
  formatPrintingLabel,
  getCardPrintings,
  hasMultiplePrintings,
  printingSummary,
} from '@/utils/variants';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const LIST_THUMB_W = 48;
const LIST_THUMB_H = 66;

export type CardTileMode = 'search' | 'collection';

interface Props {
  card: CardListItem;
  layout?: 'grid' | 'list';
  mode?: CardTileMode;
  style?: ViewStyle;
  compact?: boolean;
  enableQuickAdd?: boolean;
  collectionByVariant?: ReadonlyMap<string, CollectionEntry>;
}

function CollectionButton({
  busy,
  compact,
  onAdd,
}: {
  busy: boolean;
  compact?: boolean;
  onAdd: () => void;
}) {
  const buttonSize = compact ? 'size-7' : 'size-8';
  const iconSize = compact ? 14 : 16;
  const iconClassName = compact ? 'size-[14px]' : 'size-4';

  if (busy) {
    return (
      <View className={cn('items-center justify-center', buttonSize)}>
        <ActivityIndicator size="small" className="accent-primary" />
      </View>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(
        buttonSize,
        'rounded-md border border-border bg-background/90 active:bg-accent/60 dark:active:bg-accent/60'
      )}
      onPress={onAdd}
      hitSlop={8}
      accessibilityLabel="Add to collection"
    >
      <ButtonIcon className={cn(iconClassName, 'text-foreground dark:text-foreground')}>
        <Ionicons name="add" size={iconSize} />
      </ButtonIcon>
    </Button>
  );
}

export function CardTile({
  card,
  layout = 'grid',
  mode = 'search',
  style,
  compact = false,
  enableQuickAdd = false,
  collectionByVariant,
}: Props) {
  const router = useRouter();
  const { addCard } = useCollectionMutations();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSearch = mode === 'search';
  const priceLabel = isSearch ? null : formatListPrice(card);
  const printings = getCardPrintings(card);
  const printingsLabel = printingSummary(card);
  const multiplePrintings = hasMultiplePrintings(printings);
  const primaryPrinting = printings[0];
  const searchLine = useMemo(() => {
    if (!isSearch || !primaryPrinting) return null;
    const label = formatPrintingLabel(
      primaryPrinting.variantLabel,
      primaryPrinting.isFoil,
      primaryPrinting.variantNumber
    );
    if (label === 'Standard') return card.variantNumber;
    return `${label} · ${card.variantNumber}`;
  }, [isSearch, primaryPrinting, card.variantNumber]);

  const ownedCount = collectionByVariant?.get(card.variantNumber)?.quantity ?? 0;

  const pickerOptions = useMemo(
    () =>
      printings.map((p) => ({
        id: p.variantNumber,
        label: formatPrintingLabel(p.variantLabel, p.isFoil, p.variantNumber),
        subtitle: p.variantNumber,
        price:
          p.priceEur?.market != null
            ? `€${p.priceEur.market.toFixed(2)}`
            : p.priceEur?.low != null
              ? `€${p.priceEur.low.toFixed(2)}`
              : undefined,
      })),
    [printings]
  );

  const onOpenCard = useCallback(() => {
    void hapticPress();
    openCard(router, card.variantNumber, 'modal');
  }, [router, card.variantNumber]);

  const onQuickAdd = useCallback(async () => {
    await hapticPress();
    if (multiplePrintings) {
      setPickerVisible(true);
      return;
    }
    setBusy(true);
    try {
      await addCard.mutateAsync({ card });
    } finally {
      setBusy(false);
    }
  }, [addCard, card, multiplePrintings]);

  const onPickerSelect = useCallback(
    async (variantNumber: string) => {
      setBusy(true);
      try {
        await addCard.mutateAsync({ card, variantNumber });
      } finally {
        setBusy(false);
      }
    },
    [addCard, card]
  );

  const collectionButton = enableQuickAdd ? (
    <CollectionButton
      busy={busy}
      compact={layout === 'grid' || compact}
      onAdd={() => {
        void onQuickAdd();
      }}
    />
  ) : null;

  const sheets = enableQuickAdd ? (
    <VariantPickerSheet
      visible={pickerVisible}
      title="Which printing?"
      options={pickerOptions}
      onClose={() => {
        setPickerVisible(false);
      }}
      onSelect={(id) => {
        void onPickerSelect(id);
      }}
    />
  ) : null;

  if (layout === 'list') {
    return (
      <>
        <Pressable
          className="flex-row items-center gap-3 border-b border-border px-0.5 py-2.5 active:bg-accent/30"
          style={style}
          onPress={onOpenCard}
        >
          <View
            className="overflow-hidden rounded border border-ring/40 bg-card-panel"
            style={{ width: LIST_THUMB_W, height: LIST_THUMB_H }}
          >
            <Image
              source={{ uri: card.imageUrl }}
              className="size-full"
              contentFit="cover"
              transition={120}
              cachePolicy="memory-disk"
            />
          </View>

          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-sm font-bold tracking-wide text-foreground" numberOfLines={1}>
              {card.name}
            </Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-[11px] font-medium tracking-wide text-muted-foreground" numberOfLines={1}>
                {card.variantNumber}
                {!isSearch && card.rarity ? ` · ${card.rarity}` : ''}
              </Text>
              {ownedCount > 0 ? (
                <Text className="shrink-0 text-[11px] font-bold tabular-nums text-primary">×{ownedCount}</Text>
              ) : null}
            </View>
            {!isSearch && priceLabel ? (
              <Text className="mt-0.5 text-[11px] font-bold tabular-nums text-success">
                {priceLabel}
              </Text>
            ) : null}
          </View>

          {collectionButton ?? (
            <Ionicons name="chevron-forward" size={16} className="text-muted-foreground" />
          )}
        </Pressable>
        {sheets}
      </>
    );
  }

  return (
    <>
      <Pressable className="gap-1.5 active:opacity-90" style={style} onPress={onOpenCard}>
        <View
          className={cn(
            'relative overflow-hidden rounded-md border border-ring/40 bg-card-panel',
            compact && 'rounded'
          )}
          style={{ aspectRatio: 2.5 / 3.5 }}
        >
          <Image
            source={{ uri: card.imageUrl }}
            className="size-full"
            contentFit="cover"
            transition={120}
            cachePolicy="memory-disk"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
          {printingsLabel && !isSearch ? (
            <View className="absolute right-1 top-1 rounded-sm bg-background/80 px-1 py-px">
              <Text className="text-[7px] font-extrabold tracking-wide text-muted-foreground">
                {printingsLabel}
              </Text>
            </View>
          ) : null}
          {enableQuickAdd ? (
            <View className="absolute bottom-1 right-1">{collectionButton}</View>
          ) : null}
        </View>

        <Text
          className={cn(
            'px-px font-semibold leading-tight text-foreground',
            compact ? 'text-[10px] leading-[13px]' : 'text-xs leading-[15px]'
          )}
          numberOfLines={2}
        >
          {card.name}
        </Text>
        {searchLine ? (
          <View className="flex-row items-center gap-1 px-px">
            <Text
              className="text-[10px] font-medium text-muted-foreground"
              numberOfLines={1}
            >
              {searchLine}
            </Text>
            {ownedCount > 0 ? (
              <Text className="shrink-0 text-[10px] font-bold tabular-nums text-primary">×{ownedCount}</Text>
            ) : null}
          </View>
        ) : null}
        {!isSearch && priceLabel ? (
          <Text className="mt-0.5 text-[11px] font-bold tabular-nums text-success">
            {priceLabel}
          </Text>
        ) : null}
      </Pressable>
      {sheets}
    </>
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
      <View className="flex-row items-center gap-3 border-b border-border py-2.5 opacity-40">
        <Skeleton className="rounded" style={{ width: LIST_THUMB_W, height: LIST_THUMB_H }} />
        <View className="min-w-0 flex-1 gap-1.5">
          <Skeleton className="h-2.5 w-[65%] rounded" />
          <Skeleton className="h-2 w-[40%] rounded" />
        </View>
      </View>
    );
  }

  return (
    <View className="gap-2 opacity-40">
      <Skeleton
        className={cn('w-full rounded-md', compact && 'rounded')}
        style={{ aspectRatio: 2.5 / 3.5 }}
      />
      <Skeleton className="h-2.5 w-[85%] rounded" />
    </View>
  );
}
