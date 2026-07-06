import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
} from '@/components/ui/bottom-sheet';
import { useReduceMotion } from '@/hooks/useReduceMotion';

interface CardDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Mobile card detail — swipe-to-dismiss drawer with snap points. */
export function CardDetailDrawer({ open, onClose, children }: CardDetailDrawerProps) {
  const reduceMotion = useReduceMotion();
  const snapPoints = reduceMotion ? ['92%'] : ['58%', '92%'];

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <BottomSheetPortal>
        <BottomSheetOverlay />
        <BottomSheetContent
          snapPoints={snapPoints}
          defaultSnapIndex={0}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
          enableContentPanningGesture={false}
        >
          <BottomSheetScrollView
            className="flex-1"
            contentContainerClassName="pb-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </BottomSheetScrollView>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
