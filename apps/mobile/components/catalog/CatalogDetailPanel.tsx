import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import type { CardListPrinting } from '@riftbound/contracts';
import { OwnershipStepper } from '@/components/catalog/OwnershipStepper';
import { TrendTag } from '@/components/catalog/TrendTag';
import { VariantFamilySwitcher } from '@/components/catalog/VariantFamilySwitcher';
import { VariantPriceSummary } from '@/components/catalog/VariantPriceSummary';
import { CardRulesText } from '@/components/riftbound/CardRulesText';
import { EnergyPip, MightIcon } from '@/components/riftbound/CardIcons';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VariantPickerSheet } from '@/components/ui/VariantPickerSheet';
import { formatStat, useCardDetail } from '@/hooks/useCardDetail';
import { useCollection, useCollectionMutations } from '@/hooks/useCollection';
import { useWishlist } from '@/hooks/useWishlist';
import { addToWishlist, removeFromWishlist } from '@/services/wishlistService';
import { wishlistQueryKeys } from '@/src/api/queryKeys';
import {
  formatMarketTrend,
  formatPrintingPrice,
  getCardPrintings,
  getSearchGroupVariants,
  getVariantFamiliesFromCardVariants,
  getVariantMarketPriceDisplays,
  hasMultiplePrintings,
  isFoilVariant,
  totalOwnedForCard,
} from '@/utils/variants';
import { hapticPress } from '@/utils/haptics';
import { useQueryClient } from '@tanstack/react-query';

interface CatalogDetailPanelProps {
  variantNumber: string;
}

export function CatalogDetailPanel({ variantNumber }: CatalogDetailPanelProps) {
  const queryClient = useQueryClient();
  const detail = useCardDetail(variantNumber);
  const { setQuantity } = useCollectionMutations();
  const { data: collection = [] } = useCollection();
  const [fullscreen, setFullscreen] = useState(false);
  const [wishlistPickerVisible, setWishlistPickerVisible] = useState(false);
  const [watchBusy, setWatchBusy] = useState(false);
  const { data: wishlist = [] } = useWishlist();
  const wishlistVariants = useMemo(
    () => new Set(wishlist.map((entry) => entry.variantNumber)),
    [wishlist]
  );
  const collectionByVariant = useMemo(
    () => new Map(collection.map((e) => [e.variantNumber, e])),
    [collection]
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

      await addToWishlist({
        variantNumber: variant.variantNumber,
        name: detail.card.name,
        imageUrl: variant.imageUrl,
      });
      void queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.all });
    },
    [detail.activeVariant, detail.card, queryClient]
  );

  const removeVariantFromWishlist = useCallback(
    async (targetVariantNumber: string) => {
      await removeFromWishlist(targetVariantNumber);
      void queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.all });
    },
    [queryClient]
  );

  if (detail.isLoading || !detail.card || !detail.activeVariant) {
    return (
      <View className="items-center justify-center rounded-xl border border-border bg-card p-8">
        <ActivityIndicator size="large" className="accent-primary" />
      </View>
    );
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
    priceEur: activeVariant.prices[0] ?? null,
    printings: groupVariants.map((v) => {
      const foil = isFoilVariant(v.variantNumber, v.variantLabel, v.variantType);
      const prices = v.prices;
      const display = prices.find((p) => p.isFoil === foil) ?? prices[0] ?? null;
      return {
        variantNumber: v.variantNumber,
        variantLabel: v.variantLabel,
        isFoil: foil,
        priceEur: display,
        owned: collectionByVariant.get(v.variantNumber)?.quantity ?? 0,
      } satisfies CardListPrinting & { owned: number };
    }),
  };

  const owned = totalOwnedForCard(listItem, collectionByVariant);
  const printings = getCardPrintings(listItem);
  const showPrintingsSection = hasMultiplePrintings(printings);
  const singlePrinting = printings[0];
  const marketPrices = getVariantMarketPriceDisplays(activeVariant);
  const singleMarketPrice =
    !showPrintingsSection && marketPrices.length === 1 ? marketPrices[0] : null;
  const singlePriceTrend = formatMarketTrend(singlePrinting?.priceEur ?? null);
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

  return (
    <>
      <View className="rounded-xl border border-border bg-card">
        <Pressable
          className="items-center justify-center rounded-t-xl bg-card-panel p-3.5 active:opacity-90 web:cursor-pointer web:hover:brightness-110"
          onPress={openFullscreen}
          accessibilityRole="button"
          accessibilityLabel={`View ${card.name} full size`}
        >
          <View className="aspect-[5/7] w-full max-h-[165px] max-w-[118px]">
            <Image
              source={{ uri: activeVariant.imageUrl }}
              className="size-full rounded-lg"
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>
          <Text className="absolute right-4 top-3 font-mono text-xs text-archive-subtle">
            {activeVariant.variantNumber}
          </Text>
        </Pressable>

      <ScrollView className="max-h-[calc(100vh-280px)]" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <Text className="text-xl font-semibold leading-tight tracking-tight text-foreground">
            {card.name}
          </Text>
          {watchedElsewhereCount > 0 ? (
            <Text className="mt-1 text-xs font-medium text-primary">
              Also tracking {watchedElsewhereCount} other printing
              {watchedElsewhereCount === 1 ? '' : 's'} of this card
            </Text>
          ) : null}
          <Text className="mt-0.5 font-mono text-[13px] text-muted-foreground">
            {activeVariant.variantNumber.split('-')[0]} · {activeVariant.rarity}
          </Text>
          {variantFamilies.length > 1 && activeFamily ? (
            <VariantFamilySwitcher
              label={activeFamily.label}
              currentIndex={activeFamilyIndex}
              total={variantFamilies.length}
              onPrevious={() => {
                switchFamily(activeFamilyIndex - 1);
              }}
              onNext={() => {
                switchFamily(activeFamilyIndex + 1);
              }}
            />
          ) : null}
          {singleMarketPrice ? (
            <VariantPriceSummary
              label={singleMarketPrice.label}
              price={singleMarketPrice.price}
              trend={singlePriceTrend}
              className={variantFamilies.length > 1 ? 'mt-1' : undefined}
              hideLabel={variantFamilies.length > 1}
            />
          ) : null}

          <View className="mt-3 flex-row overflow-hidden rounded-xl bg-card-panel">
            <Stat label="Cost">
              <EnergyPip value={card.energy} size={28} />
            </Stat>
            <View className="w-hairline bg-archive-soft-line" />
            <Stat label="Might">
              <View className="flex-row items-center gap-1">
                <MightIcon size={16} />
                <Text className="font-mono text-base font-semibold text-foreground">
                  {formatStat(card.might)}
                </Text>
              </View>
            </Stat>
            <View className="w-hairline bg-archive-soft-line" />
            <Stat label="Owned">
              {showPrintingsSection ? (
                <Text className="font-mono text-base font-semibold tabular-nums text-foreground">
                  {owned}
                </Text>
              ) : singlePrinting ? (
                <OwnershipStepper
                  owned={owned}
                  name={card.name}
                  compact
                  printings={listItem.printings}
                  fixedVariantNumber={singlePrinting.variantNumber}
                  onAdd={() => {
                    void detail.onAddToCollection(singlePrinting.variantNumber);
                  }}
                  onRemove={() => {
                    const entry = collectionByVariant.get(singlePrinting.variantNumber);
                    if (!entry) return;
                    void setQuantity.mutateAsync({
                      variantNumber: singlePrinting.variantNumber,
                      quantity: Math.max(0, entry.quantity - 1),
                    });
                  }}
                />
              ) : (
                <Text className="font-mono text-base font-semibold tabular-nums text-foreground">
                  {owned}
                </Text>
              )}
            </Stat>
          </View>

          <View className="mt-3 rounded-xl border border-archive-soft-line p-3">
            <MetaRow label="Type" value={card.type} />
            <MetaRow label="Domain" value={card.colors.map((c) => c.name).join(' / ') || '—'} />
            <MetaRow label="Rarity" value={activeVariant.rarity} />
            {card.tags.length > 0 ? (
              <MetaRow label="Tags" value={card.tags.join(' · ')} />
            ) : null}
          </View>

          {card.description ? (
            <View className="mt-3 rounded-xl bg-card-panel p-3">
              <Text className="mb-2 text-sm font-semibold text-foreground">Rules text</Text>
              <CardRulesText text={card.description} />
            </View>
          ) : null}

          {showPrintingsSection ? (
            <View className="mt-3">
              <Text className="mb-2 text-sm font-semibold text-foreground">Printings</Text>
              {printings.map((printing) => {
              const qty = collectionByVariant.get(printing.variantNumber)?.quantity ?? 0;
              const foilTag =
                printing.isFoil && !printing.variantLabel.toLowerCase().includes('foil');
              return (
                <View
                  key={printing.variantNumber}
                  className="mb-2 flex-row items-start justify-between gap-3 rounded-xl border border-archive-soft-line bg-card p-3"
                >
                  <View className="min-w-0 shrink flex-1" style={{ flexBasis: 0 }}>
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="shrink text-sm font-semibold text-foreground" numberOfLines={2}>
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
                        void setQuantity.mutateAsync({
                          variantNumber: printing.variantNumber,
                          quantity: Math.max(0, entry.quantity - 1),
                        });
                      }}
                    />
                  </View>
                </View>
              );
            })}
            </View>
          ) : null}

          <Button
            variant={isWatchingActive ? 'outline' : 'default'}
            className={
              isWatchingActive
                ? 'mt-3 h-10 w-full border-primary/30 bg-primary/10'
                : 'mt-3 h-10 w-full bg-primary'
            }
            busy={watchBusy}
            onPress={() => {
              void handleWatchPress();
            }}
          >
            <ButtonIcon className={isWatchingActive ? 'text-primary' : 'text-primary-foreground'}>
              <Ionicons name={isWatchingActive ? 'bookmark' : 'bookmark-outline'} size={16} />
            </ButtonIcon>
            <ButtonText className={isWatchingActive ? 'text-primary' : 'text-primary-foreground'}>
              {isWatchingActive ? 'Watching · Stop tracking' : 'Watch this card'}
            </ButtonText>
          </Button>
        </View>
      </ScrollView>
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
    </>
  );
}

function CatalogCardFullscreen({
  visible,
  imageUrl,
  name,
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
        <View
          className="relative z-10 overflow-hidden rounded-xl"
          style={{ width: cardWidth, height: cardHeight }}
        >
          <Image
            source={{ uri: imageUrl }}
            className="size-full"
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
            accessibilityLabel={name}
          />
        </View>
      </View>
    </Modal>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="min-h-[60px] flex-1 items-center justify-center gap-1 px-2 py-3">
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      {children}
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-2 min-w-0">
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      <Text className="mt-1 text-sm font-semibold text-foreground" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
