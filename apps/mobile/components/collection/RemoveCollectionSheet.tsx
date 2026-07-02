import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet';
import { Button, ButtonText } from '@/components/ui/button';
import {
  InlineList,
  InlineListItem,
  InlineListItemAddon,
  InlineListItemDescription,
  InlineListItemTitle,
} from '@/components/ui/inline-list';
import { Text } from '@/components/ui/text';
import type { CollectedPrintingRow } from '@/utils/collectionRemove';

interface Props {
  visible: boolean;
  cardName: string;
  items: CollectedPrintingRow[];
  onClose: () => void;
  onRemovePrinting: (variantNumber: string) => void;
  onRemoveAll: () => void;
}

export function RemoveCollectionSheet({
  visible,
  cardName,
  items,
  onClose,
  onRemovePrinting,
  onRemoveAll,
}: Props) {
  return (
    <BottomSheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheetPortal>
        <BottomSheetOverlay />
        <BottomSheetContent enableDynamicSizing enablePanDownToClose>
          <BottomSheetHeader>
            <BottomSheetTitle>Remove from collection</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetBody className="gap-3 pb-4">
            <Text className="text-sm leading-5 text-muted-foreground">
              You have multiple printings of {cardName}. Which should be removed?
            </Text>

            <InlineList>
              {items.map((item) => (
                <InlineListItem
                  key={item.variantNumber}
                  onPress={() => {
                    onRemovePrinting(item.variantNumber);
                  }}
                >
                  <InlineListItemTitle>{item.label}</InlineListItemTitle>
                  <InlineListItemDescription>{item.variantNumber}</InlineListItemDescription>
                  <InlineListItemAddon align="inline-end">
                    <Text className="text-[13px] font-bold text-ring">
                      {item.quantity > 1 ? `−1 (×${String(item.quantity)})` : 'Remove'}
                    </Text>
                  </InlineListItemAddon>
                </InlineListItem>
              ))}
            </InlineList>

            {items.length > 1 ? (
              <Button
                variant="outline"
                className="border-ring/40 bg-primary/5"
                onPress={onRemoveAll}
              >
                <ButtonText className="text-ring">Remove all printings</ButtonText>
              </Button>
            ) : null}

            <Button variant="ghost" onPress={onClose}>
              <ButtonText className="text-muted-foreground">Cancel</ButtonText>
            </Button>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
