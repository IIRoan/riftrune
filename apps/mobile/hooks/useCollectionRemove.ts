import { useCallback, useState } from 'react';
import { useCollectionMutations } from '@/hooks/useCollection';
import type { CollectedPrintingRow } from '@/utils/collectionRemove';
import { confirmRemoveFromCollection } from '@/utils/collectionConfirm';
import { hapticPress } from '@/utils/haptics';

interface RemoveSheetState {
  cardName: string;
  items: CollectedPrintingRow[];
}

export function useCollectionRemove() {
  const { setQuantity, removeCard, removeMany } = useCollectionMutations();
  const [sheet, setSheet] = useState<RemoveSheetState | null>(null);

  const closeSheet = useCallback(() => {
    setSheet(null);
  }, []);

  const promptRemove = useCallback(
    async (cardName: string, collected: CollectedPrintingRow[]) => {
      if (collected.length === 0) return;
      await hapticPress();

      if (collected.length === 1) {
        const only = collected[0];
        if (only.quantity > 1) {
          await setQuantity.mutateAsync({
            variantNumber: only.variantNumber,
            quantity: only.quantity - 1,
          });
          return;
        }
        confirmRemoveFromCollection(cardName, () => {
          void removeCard.mutateAsync(only.variantNumber);
        });
        return;
      }

      setSheet({ cardName, items: collected });
    },
    [setQuantity, removeCard]
  );

  const onSheetRemovePrinting = useCallback(
    (variantNumber: string) => {
      if (!sheet) return;
      const item = sheet.items.find((i) => i.variantNumber === variantNumber);
      if (!item) return;
      closeSheet();

      if (item.quantity > 1) {
        void setQuantity.mutateAsync({
          variantNumber,
          quantity: item.quantity - 1,
        });
        return;
      }

      confirmRemoveFromCollection(sheet.cardName, () => {
        void removeCard.mutateAsync(variantNumber);
      });
    },
    [sheet, closeSheet, setQuantity, removeCard]
  );

  const onSheetRemoveAll = useCallback(() => {
    if (!sheet) return;
    const { cardName, items } = sheet;
    closeSheet();
    confirmRemoveFromCollection(`all printings of ${cardName}`, () => {
      void removeMany.mutateAsync(items.map((i) => i.variantNumber));
    });
  }, [sheet, closeSheet, removeMany]);

  return {
    sheet,
    closeSheet,
    promptRemove,
    onSheetRemovePrinting,
    onSheetRemoveAll,
  };
}
