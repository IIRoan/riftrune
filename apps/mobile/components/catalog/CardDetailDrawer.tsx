import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
} from '@/components/ui/bottom-sheet';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CardDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Mobile card detail — swipe-to-dismiss drawer with snap points. */
export function CardDetailDrawer({ open, onClose, children }: CardDetailDrawerProps) {
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const snapPoints = reduceMotion ? ['92%'] : ['58%', '92%'];
  const defaultSnapIndex = 0;

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
          defaultSnapIndex={defaultSnapIndex}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
          enableContentPanningGesture
        >
          <BottomSheetScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
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
