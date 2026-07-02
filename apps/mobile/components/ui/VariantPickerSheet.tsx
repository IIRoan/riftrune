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

export interface VariantPickerOption {
  id: string;
  label: string;
  subtitle?: string;
  price?: string;
}

interface VariantPickerSheetProps {
  visible: boolean;
  title: string;
  options: VariantPickerOption[];
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function VariantPickerSheet({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: VariantPickerSheetProps) {
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
            <BottomSheetTitle>{title}</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetBody className="gap-3 pb-4">
            <InlineList>
              {options.map((option) => (
                <InlineListItem
                  key={option.id}
                  onPress={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                >
                  <InlineListItemTitle>{option.label}</InlineListItemTitle>
                  {option.subtitle ? (
                    <InlineListItemDescription>{option.subtitle}</InlineListItemDescription>
                  ) : null}
                  {option.price ? (
                    <InlineListItemAddon align="inline-end">
                      <Text className="text-[15px] font-bold text-success">{option.price}</Text>
                    </InlineListItemAddon>
                  ) : null}
                </InlineListItem>
              ))}
            </InlineList>
            <Button variant="ghost" onPress={onClose}>
              <ButtonText className="text-muted-foreground">Cancel</ButtonText>
            </Button>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
