import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CardListItem } from '@riftbound/contracts';
import {
  useCollectionMutations,
  useCollectionOwnership,
} from '@/hooks/useCollection';
import { collectVariantNumbers } from '@/utils/collectionOwnership';
import { useCollectionRemove } from '@/hooks/useCollectionRemove';
import { cardListItemToDetailResponse } from '@/lib/cardDetailPlaceholder';
import { formatPrintingLabel, findVariantByNumber, getSearchGroupVariants, isFoilVariant, cardListItemMatchesVariant, pickVariantDisplayPrice } from '@/utils/variants';
import {
  getCollectedPrintingsForDetailCard,
} from '@/utils/collectionRemove';
import { hapticPress } from '@/utils/haptics';
import { closeCard } from '@/utils/cardNavigation';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';

export function formatCardPrice(
  prices: { market: number | null; low: number | null; isFoil: boolean }[],
  variant: {
    variantNumber: string;
    variantLabel: string;
    variantType?: string;
  }
): string | null {
  const row = pickVariantDisplayPrice(prices, variant);
  const amount = row?.market;
  return amount != null ? `€${amount.toFixed(2)}` : null;
}

export { getVariantMarketPriceDisplays, type MarketPriceDisplay } from '@/utils/variants';

export function formatStat(value: number): string {
  return value > 0 ? String(value) : '—';
}

export function useCardDetail(
  variantNumber: string,
  options?: { listItem?: CardListItem | null }
) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState(variantNumber);
  const [pickerVisible, setPickerVisible] = useState(false);
  const { listItem } = options ?? {};

  const listPlaceholder = useMemo(() => {
    if (!listItem || !cardListItemMatchesVariant(listItem, variantNumber)) {
      return undefined;
    }
    return cardListItemToDetailResponse(listItem);
  }, [listItem, variantNumber]);

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: cardQueryKeys.detail(variantNumber),
    queryFn: () => api.getCard(variantNumber),
    enabled: Boolean(variantNumber),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    placeholderData: listPlaceholder,
  });

  useEffect(() => {
    if (variantNumber) {
      setSelectedVariant(variantNumber);
    }
  }, [variantNumber]);

  const card = data?.data;
  const activeVariant =
    (card ? findVariantByNumber(card.variants, selectedVariant) : undefined) ??
    (card ? findVariantByNumber(card.variants, variantNumber) : undefined) ??
    card?.variants[0];

  const detailVariants = useMemo(() => {
    if (card) return card.variants.map((variant) => variant.variantNumber);
    if (listItem) return collectVariantNumbers([listItem], [variantNumber]);
    return variantNumber ? [variantNumber] : [];
  }, [card, listItem, variantNumber]);

  const { collectionByVariant } = useCollectionOwnership(detailVariants);

  const collectedForCard = useMemo(() => {
    if (!card || !activeVariant) return [];
    return getCollectedPrintingsForDetailCard(card, collectionByVariant, {
      variantNumber: activeVariant.variantNumber,
      variantLabel: activeVariant.variantLabel,
      variantType: activeVariant.variantType,
    });
  }, [card, activeVariant, collectionByVariant]);

  const ownedQuantity = activeVariant
    ? (collectionByVariant.get(activeVariant.variantNumber)?.quantity ?? 0)
    : 0;
  const collectionEntry = useMemo(() => {
    if (!activeVariant || ownedQuantity <= 0) return null;
    return {
      quantity: ownedQuantity,
      isFoil: isFoilVariant(
        activeVariant.variantNumber,
        activeVariant.variantLabel,
        activeVariant.variantType
      ),
    };
  }, [activeVariant, ownedQuantity]);
  const { addFromDetail, setQuantity } = useCollectionMutations();
  const {
    sheet,
    closeSheet,
    promptRemove,
    onSheetRemovePrinting,
    onSheetRemoveAll,
  } = useCollectionRemove();

  const handleClose = useCallback(() => {
    closeCard(router);
  }, [router]);

  const groupVariants = useMemo(() => {
    if (!card || !activeVariant) return [];
    return getSearchGroupVariants(card.variants, activeVariant);
  }, [card, activeVariant]);

  const needsPrintingPicker = useMemo(() => {
    return groupVariants.length > 1;
  }, [groupVariants]);

  const pickerOptions = useMemo(() => {
    return groupVariants.map((variant) => {
      const foil = isFoilVariant(
        variant.variantNumber,
        variant.variantLabel,
        variant.variantType
      );
      const price = pickVariantDisplayPrice(variant.prices, variant);
      const amount = price?.market ?? null;
      return {
        id: variant.variantNumber,
        label: formatPrintingLabel(variant.variantLabel, foil, variant.variantNumber),
        subtitle: variant.variantNumber,
        price: amount != null ? `€${amount.toFixed(2)}` : undefined,
      };
    });
  }, [groupVariants]);

  const printingPreviews = useMemo(() => {
    return groupVariants.map((variant) => {
      return {
        id: variant.id,
        variantNumber: variant.variantNumber,
        variantLabel: variant.variantLabel,
        variantType: variant.variantType,
        imageUrl: variant.imageUrl,
        price: formatCardPrice(variant.prices, variant),
      };
    });
  }, [groupVariants]);

  const onAddToCollection = useCallback(
    async (targetVariantNumber: string) => {
      if (!card) return;
      await hapticPress();
      await addFromDetail.mutateAsync({ card, variantNumber: targetVariantNumber });
      setSelectedVariant(targetVariantNumber);
    },
    [card, addFromDetail]
  );

  const onAddPress = useCallback(async () => {
    if (!card || !activeVariant) return;
    await hapticPress();
    if (needsPrintingPicker) {
      setPickerVisible(true);
      return;
    }
    await onAddToCollection(activeVariant.variantNumber);
  }, [card, activeVariant, needsPrintingPicker, onAddToCollection]);

  const onRemovePress = useCallback(() => {
    if (!card) return;
    void promptRemove(card.name, collectedForCard);
  }, [card, collectedForCard, promptRemove]);

  const onQuantityChange = useCallback(
    async (delta: number) => {
      if (!activeVariant || ownedQuantity <= 0) return;
      const next = ownedQuantity + delta;
      if (next <= 0) {
        if (!card) return;
        void promptRemove(card.name, collectedForCard);
        return;
      }
      await hapticPress();
      await setQuantity.mutateAsync({
        variantNumber: activeVariant.variantNumber,
        quantity: next,
      });
    },
    [activeVariant, ownedQuantity, setQuantity, card, collectedForCard, promptRemove]
  );

  const onSelectPrinting = useCallback((id: string) => {
    void hapticPress();
    setSelectedVariant(id);
  }, []);

  return {
    card,
    activeVariant,
    isLoading,
    isError,
    isPlaceholderData,
    collectionEntry,
    collectedForCard,
    pickerVisible,
    setPickerVisible,
    pickerOptions,
    printingPreviews,
    handleClose,
    onAddPress,
    onRemovePress,
    onQuantityChange,
    onAddToCollection,
    onSelectPrinting,
    removeSheet: sheet,
    closeRemoveSheet: closeSheet,
    onRemoveSheetPrinting: onSheetRemovePrinting,
    onRemoveSheetAll: onSheetRemoveAll,
  };
}
