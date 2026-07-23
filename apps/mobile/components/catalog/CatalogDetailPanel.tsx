import { BookmarkIcon, ThemedIcon } from '@/components/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CardArtImage } from '@/components/cards/CardArtImage';
import { AppLoader } from '@/components/ui/app-loader';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import type { CardListItem, CardListPrinting } from '@riftbound/contracts';
import { OwnershipStepper } from '@/components/catalog/OwnershipStepper';
import { TrendTag } from '@/components/catalog/TrendTag';
import { VariantFamilySwitcher } from '@/components/catalog/VariantFamilySwitcher';
import { VariantPriceSummary } from '@/components/catalog/VariantPriceSummary';
import { CardRulesText } from '@/components/riftbound/CardRulesText';
import { CardBannedOverlay } from '@/components/riftbound/CardBannedOverlay';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { CardTag } from '@/components/riftbound/CardDetailParts';
import {
  DomainIcon,
  EnergyPip,
  MightIcon,
  RarityIcon,
  TypeIcon,
} from '@/components/riftbound/CardIcons';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { VariantPickerSheet } from '@/components/ui/VariantPickerSheet';
import { formatStat } from '@/utils/cardFormat';
import { useCardDetail } from '@/hooks/useCardDetail';
import { useCollection, useCollectionMutations, useCollectionOwnership } from '@/hooks/useCollection';
import {
  collectVariantNumbers,
  ownershipMapFromCollection,
  preferCollectionOwnership,
} from '@/utils/collectionOwnership';
import { useWishlist } from '@/hooks/useWishlist';
import { useWishlistMutations } from '@/hooks/useWishlistMutations';
import type { WishlistPriceItem } from '@/hooks/useWishlistPrices';
import { useVariantPriceHistory } from '@/hooks/useVariantPriceHistory';
import { WishlistPriceHistoryPanel } from '@/components/wishlist/WishlistPriceHistoryPanel';
import {
  formatMarketTrend,
  formatPrintingPrice,
  getCardPrintings,
  getSearchGroupVariants,
  getVariantFamiliesFromCardVariants,
  getVariantMarketPriceDisplays,
  isFoilVariant,
  pickVariantDisplayPrice,
  toPriceEurSummary,
} from '@/utils/variants';
import { cn } from '@/lib/utils';
import { isCardBannedAt } from '@riftbound/contracts';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { hapticPress } from '@/utils/haptics';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

interface CatalogDetailPanelProps {
  variantNumber: string;
  /** Catalog list row used to render instantly while full detail loads. */
  catalogListItem?: CardListItem | null;
  /** `drawer` — inside mobile bottom sheet (no outer chrome / nested scroll). */
  embedded?: 'panel' | 'drawer';
  /** Hide add/remove collection controls (e.g. deck view-only preview). */
  hideCollectionActions?: boolean;
  /** Optional wishlist-enriched history when opened from the wishlist tab. */
  wishlistItem?: WishlistPriceItem | null;
  /** Hide 30-day trend (e.g. deck view-only). Default: show. */
  hidePriceHistory?: boolean;
}

export function CatalogDetailPanel({
  variantNumber,
  catalogListItem = null,
  embedded = 'panel',
  hideCollectionActions = false,
  wishlistItem = null,
  hidePriceHistory = false,
}: CatalogDetailPanelProps) {
  const detail = useCardDetail(variantNumber, { listItem: catalogListItem });
  const { setQuantity } = useCollectionMutations();
  const { data: collectionEntries = [] } = useCollection();
  const detailVariants = useMemo(() => {
    if (detail.card) {
      return detail.card.variants.map((variant) => variant.variantNumber);
    }
    if (catalogListItem) return collectVariantNumbers([catalogListItem], [variantNumber]);
    return [variantNumber];
  }, [catalogListItem, detail.card, variantNumber]);
  const { collectionByVariant: fetchedOwnership } = useCollectionOwnership(detailVariants);
  const collectionByVariant = useMemo(() => {
    const fromCollection = ownershipMapFromCollection(collectionEntries);
    return preferCollectionOwnership(fetchedOwnership, fromCollection);
  }, [collectionEntries, fetchedOwnership]);
  const [fullscreen, setFullscreen] = useState(false);
  const [wishlistPickerVisible, setWishlistPickerVisible] = useState(false);
  const [watchBusy, setWatchBusy] = useState(false);
  const { data: wishlist = [] } = useWishlist();
  const { add: addWishlist, remove: removeWishlist } = useWishlistMutations();
  const wishlistVariants = useMemo(
    () => new Set(wishlist.map((entry) => entry.variantNumber)),
    [wishlist]
  );

  useEffect(() => {
    setFullscreen(false);
    setWishlistPickerVisible(false);
  }, [variantNumber]);

  useEffect(() => {
    if (!fullscreen || Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  const openFullscreen = useCallback(() => {
    void hapticPress();
    setFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreen(false);
  }, []);

  const addVariantToWishlist = useCallback(
    async (targetVariantNumber: string) => {
      if (!detail.card) return;
      const variant =
        detail.card.variants.find((item) => item.variantNumber === targetVariantNumber) ??
        detail.activeVariant;
      if (!variant) return;

      await addWishlist.mutateAsync({
        variantNumber: variant.variantNumber,
        name: detail.card.name,
        imageUrl: variant.imageUrl,
      });
    },
    [addWishlist, detail.activeVariant, detail.card]
  );

  const removeVariantFromWishlist = useCallback(
    async (targetVariantNumber: string) => {
      await removeWishlist.mutateAsync(targetVariantNumber);
    },
    [removeWishlist]
  );

  const activeVariantNumber = detail.activeVariant?.variantNumber;
  const activeIsFoil = detail.activeVariant
    ? isFoilVariant(
        detail.activeVariant.variantNumber,
        detail.activeVariant.variantLabel,
        detail.activeVariant.variantType
      )
    : false;
  const priceHistory = useVariantPriceHistory(activeVariantNumber, {
    isFoil: activeIsFoil,
    enabled: !hidePriceHistory && Boolean(activeVariantNumber),
  });

  if (!detail.card || !detail.activeVariant) {
    if (detail.isLoading) {
      return (
        <View className="items-center justify-center rounded-xl border border-border bg-card p-8">
          <AppLoader size="lg" />
        </View>
      );
    }
    return null;
  }

  const { card, activeVariant } = detail;
  const variantFamilies = getVariantFamiliesFromCardVariants(card.variants);
  const activeFamilyIndex = Math.max(
    0,
    variantFamilies.findIndex((family) =>
      family.variants.some((variant) => variant.variantNumber === activeVariant.variantNumber)
    )
  );
  const activeFamily = variantFamilies[activeFamilyIndex] ?? variantFamilies[0];

  const switchFamily = (nextIndex: number) => {
    const family = variantFamilies[nextIndex];
    if (!family) return;
    void hapticPress();
    detail.onSelectPrinting(family.representativeVariantNumber);
  };

  const groupVariants = getSearchGroupVariants(card.variants, activeVariant);
  const listItem = {
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
    priceEur: toPriceEurSummary(pickVariantDisplayPrice(activeVariant.prices, activeVariant)),
    printings: groupVariants.map((v) => {
      const foil = isFoilVariant(v.variantNumber, v.variantLabel, v.variantType);
      const display = pickVariantDisplayPrice(v.prices, v);
      return {
        variantNumber: v.variantNumber,
        variantLabel: v.variantLabel,
        isFoil: foil,
        priceEur: toPriceEurSummary(display),
        owned: collectionByVariant.get(v.variantNumber)?.quantity ?? 0,
      } satisfies CardListPrinting & { owned: number };
    }),
    isBanned: isCardBannedAt(card.banEffectiveDate),
  };

  const printings = getCardPrintings(listItem);
  const marketPrices = getVariantMarketPriceDisplays(activeVariant);
  // Always show the active printing's price in the header — never a range of every variant.
  const singleMarketPrice = marketPrices[0] ?? null;
  const singlePriceTrend = formatMarketTrend(
    toPriceEurSummary(pickVariantDisplayPrice(activeVariant.prices, activeVariant))
  );
  const isWatchingActive = wishlistVariants.has(activeVariant.variantNumber);
  const watchedElsewhereCount = card.variants.filter(
    (variant) =>
      wishlistVariants.has(variant.variantNumber) &&
      !groupVariants.some((groupVariant) => groupVariant.variantNumber === variant.variantNumber)
  ).length;

  const handleWatchPress = async () => {
    await hapticPress();
    if (isWatchingActive) {
      setWatchBusy(true);
      try {
        await removeVariantFromWishlist(activeVariant.variantNumber);
      } finally {
        setWatchBusy(false);
      }
      return;
    }

    if (groupVariants.length > 1) {
      setWishlistPickerVisible(true);
      return;
    }

    setWatchBusy(true);
    try {
      await addVariantToWishlist(activeVariant.variantNumber);
    } finally {
      setWatchBusy(false);
    }
  };

  const setCode = activeVariant.variantNumber.split('-')[0] ?? '';
  const detailImageUri = resolveImageUrl(activeVariant.imageUrl);
  const isDrawer = embedded === 'drawer';
  const isBanned = isCardBannedAt(card.banEffectiveDate);

  const showVariantSwitcher = variantFamilies.length > 1 && activeFamily;

  const variantFamilySwitcher = showVariantSwitcher ? (
    <VariantFamilySwitcher
      label={activeFamily.label}
      currentIndex={activeFamilyIndex}
      total={variantFamilies.length}
      prominent={isDrawer}
      onPrevious={() => {
        switchFamily(activeFamilyIndex - 1);
      }}
      onNext={() => {
        switchFamily(activeFamilyIndex + 1);
      }}
    />
  ) : null;

  // Per-printing ownership controls live above the stats strip — Standard / Foil
  // each get their own row so we never double-count with a separate active CTA.
  const printingCollectionRows =
    printings.length > 0 ? (
      <View className="bg-card-panel">
        {printings.map((printing, index) => {
          const qty = collectionByVariant.get(printing.variantNumber)?.quantity ?? 0;
          const foilTag =
            printing.isFoil && !printing.variantLabel.toLowerCase().includes('foil');
          return (
            <View key={printing.variantNumber}>
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
                    {foilTag ? (
                      <View className="rounded bg-primary/15 px-1.5 py-0.5">
                        <Text className="text-[11px] font-semibold text-archive-accent-text">
                          Foil
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="font-mono text-[11px] text-archive-subtle" numberOfLines={1}>
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
                      name={`${card.name} ${printing.variantLabel}`}
                      compact
                      printings={listItem.printings}
                      fixedVariantNumber={printing.variantNumber}
                      onAdd={() => {
                        void detail.onAddToCollection(printing.variantNumber);
                      }}
                      onRemove={() => {
                        const entry = collectionByVariant.get(printing.variantNumber);
                        if (!entry) return;
                        setQuantity.mutate({
                          variantNumber: printing.variantNumber,
                          quantity: Math.max(0, entry.quantity - 1),
                        });
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
        <Stat label="Cost">
          <EnergyPip value={card.energy} size={22} />
        </Stat>
        <View className="w-hairline bg-border" />
        <Stat label="Might">
          <View className="flex-row items-center gap-1">
            <MightIcon size={14} />
            <Text className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatStat(card.might)}
            </Text>
          </View>
        </Stat>
        <View className="w-hairline bg-border" />
        <Stat label="Power">
          <Text className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatStat(card.power)}
          </Text>
        </Stat>
      </View>
    </View>
  );

  const detailBody = (
    <View className="gap-3 p-3">
            {collectionAndStats}

            <View className="flex-row flex-wrap gap-x-4 gap-y-3 rounded-xl border border-archive-soft-line p-3">
              <MetaPill label="Type" icon={<TypeIcon type={card.type} size={16} />}>
                <Text className="text-sm font-semibold text-foreground">{card.type}</Text>
              </MetaPill>
              <MetaPill label="Domain">
                {card.colors.length > 0 ? (
                  <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                    {card.colors.map((color) => (
                      <View key={color.id} className="flex-row items-center gap-1">
                        <DomainIcon name={color.name} imageUrl={color.imageUrl} size={16} />
                        <Text className="text-sm font-semibold text-foreground">{color.name}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-sm font-semibold text-foreground">—</Text>
                )}
              </MetaPill>
              <MetaPill label="Rarity" icon={<RarityIcon rarity={activeVariant.rarity} size={16} />}>
                <Text className="text-sm font-semibold text-foreground">{activeVariant.rarity}</Text>
              </MetaPill>
              {card.tags.length > 0 ? (
                <MetaPill label="Tags">
                  <View className="flex-row flex-wrap gap-1">
                    {card.tags.map((tag) => (
                      <CardTag key={tag} label={tag} />
                    ))}
                  </View>
                </MetaPill>
              ) : null}
            </View>

            {detail.isPlaceholderData && !card.description ? (
              <View className="gap-2 rounded-xl bg-card-panel p-3">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-[92%] rounded" />
                <Skeleton className="h-3 w-[80%] rounded" />
              </View>
            ) : card.description ? (
              <View className="rounded-xl bg-card-panel p-3">
                <CardRulesText text={card.description} />
              </View>
            ) : null}

            {!hidePriceHistory ? (
              <View className="gap-2" style={{ minHeight: 196 }}>
                <Text className="text-sm font-semibold text-foreground">Daily trend</Text>
                {wishlistItem &&
                wishlistItem.variantNumber === activeVariant.variantNumber ? (
                  <WishlistPriceHistoryPanel item={wishlistItem} />
                ) : priceHistory.panelItem ? (
                  <WishlistPriceHistoryPanel item={priceHistory.panelItem} />
                ) : (
                  <View className="min-h-[160px] justify-center rounded-xl border border-border bg-card p-3">
                    <Text className="text-xs leading-5 text-muted-foreground">
                      {priceHistory.isLoading
                        ? 'Loading daily trend history…'
                        : 'No daily trend snapshots yet. Prices sync once per day from Cardmarket.'}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            <View className="gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isWatchingActive ? 'Remove from wishlist' : 'Add to wishlist'
                }
                className={cn(
                  'h-10 w-full flex-row items-center justify-center gap-1.5 rounded-full web:cursor-pointer',
                  isWatchingActive
                    ? 'bg-primary/18 active:bg-primary/24'
                    : 'bg-primary/12 active:bg-primary/18',
                  watchBusy && 'opacity-60'
                )}
                disabled={watchBusy}
                onPress={() => {
                  void handleWatchPress();
                }}
              >
                {watchBusy ? (
                  <ActivityIndicator size="small" className="accent-primary" />
                ) : (
                  <>
                    <ThemedIcon
                      icon={BookmarkIcon}
                      size={16}
                      color="archive-accent-text"
                      weight={isWatchingActive ? 'fill' : 'regular'}
                    />
                    <Text className="text-sm font-semibold text-archive-accent-text">
                      {isWatchingActive ? 'Wishlisted · tap to remove' : 'Wishlist card'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Extra scroll extent so the bottom CTA clears the home indicator. */}
            {isDrawer ? <View style={{ height: 72 }} /> : null}
    </View>
  );

  return (
    <>
      <View
        className={cn(
          'bg-card',
          isDrawer ? undefined : 'overflow-hidden rounded-xl border border-border'
        )}
      >
        <View className={cn('flex-row gap-3 p-3', !isDrawer && 'bg-card-panel')}>
          <Pressable
            className="shrink-0 active:opacity-90 web:cursor-pointer"
            onPress={openFullscreen}
            accessibilityRole="button"
            accessibilityLabel={`View ${card.name} full size`}
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
                recyclingKey={activeVariant.variantNumber}
                className="absolute inset-0"
                contentFit="contain"
                contentPosition="center"
                transition={isDrawer ? 0 : 200}
              />
              {isBanned ? <CardBannedOverlay /> : null}
            </View>
            <Text className="mt-1 text-center font-mono text-[10px] text-archive-subtle">
              {activeVariant.variantNumber}
            </Text>
          </Pressable>

          <View className="min-w-0 flex-1 justify-center gap-1.5">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text
                className="text-xl font-semibold leading-tight tracking-tight text-foreground"
                numberOfLines={2}
              >
                {card.name}
              </Text>
              {isBanned ? <StatusKeywordBadge status="illegal" /> : null}
            </View>
            {isBanned ? (
              <Text className="text-xs text-destructive">
                Banned in tournament play.
              </Text>
            ) : null}
            <View className="flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <Text className="font-mono text-xs text-muted-foreground">{setCode}</Text>
              <Text className="text-xs text-muted-foreground">·</Text>
              <RarityIcon rarity={activeVariant.rarity} size={14} />
              <Text className="text-xs font-medium text-muted-foreground">
                {activeVariant.rarity}
              </Text>
            </View>
            {singleMarketPrice ? (
              <VariantPriceSummary
                label={singleMarketPrice.label}
                price={singleMarketPrice.price}
                trend={singlePriceTrend}
                className="mt-0"
                hideLabel={variantFamilies.length > 1}
              />
            ) : null}
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

        {isDrawer ? (
          detailBody
        ) : (
          <ScrollView className="max-h-[calc(100vh-280px)]" showsVerticalScrollIndicator={false}>
            {detailBody}
          </ScrollView>
        )}
      </View>

      <CatalogCardFullscreen
        visible={fullscreen}
        imageUrl={activeVariant.imageUrl}
        name={card.name}
        onClose={closeFullscreen}
      />
      <VariantPickerSheet
        visible={wishlistPickerVisible}
        title="Add which printing?"
        options={detail.pickerOptions}
        onClose={() => {
          setWishlistPickerVisible(false);
        }}
        onSelect={(id) => {
          setWishlistPickerVisible(false);
          void addVariantToWishlist(id);
        }}
      />
      <VariantPickerSheet
        visible={detail.pickerVisible}
        title="Which printing?"
        options={detail.pickerOptions}
        onClose={() => {
          detail.setPickerVisible(false);
        }}
        onSelect={(id) => {
          detail.setPickerVisible(false);
          void detail.onAddToCollection(id);
        }}
      />
    </>
  );
}

function CatalogCardFullscreen({
  visible,
  imageUrl,
  name: _name,
  onClose,
}: {
  visible: boolean;
  imageUrl: string;
  name: string;
  onClose: () => void;
}) {
  const { height: windowHeight } = useWindowDimensions();

  if (!visible) return null;

  const cardHeight = Math.min(windowHeight * 0.88, 560);
  const cardWidth = cardHeight * (5 / 7);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/85">
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityLabel="Close full size card"
        />
        <CardArtImage
          uri={resolveImageUrl(imageUrl)}
          recyclingKey={imageUrl}
          className={cn('relative z-10', CARD_ART_RADIUS_CLASS)}
          style={{ width: cardWidth, height: cardHeight }}
          contentFit="contain"
          contentPosition="center"
        />
      </View>
    </Modal>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="min-h-[44px] flex-1 items-center justify-center gap-0.5 px-1 py-2">
      <Text className="text-[11px] font-medium text-muted-foreground">{label}</Text>
      {children}
    </View>
  );
}

function MetaPill({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="min-w-[42%] flex-1">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      </View>
      <View className="mt-1">{children}</View>
    </View>
  );
}
