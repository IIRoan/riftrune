import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
} from '@/components/ui/bottom-sheet';
import { View } from 'react-native';

type MobilePanel = 'info' | 'list' | null;

interface DeckBuilderMobileSheetProps {
  mobilePanel: MobilePanel;
  onClose: () => void;
  mobileSnapPoints: string[];
  reduceMotion: boolean;
  sheetPaddingBottom: number;
  infoDrawer: React.ReactNode;
  compositionList: React.ReactNode;
}

export function DeckBuilderMobileSheet({
  mobilePanel,
  onClose,
  mobileSnapPoints,
  reduceMotion,
  sheetPaddingBottom,
  infoDrawer,
  compositionList,
}: DeckBuilderMobileSheetProps) {
  return (
    <BottomSheet
      open={mobilePanel != null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <BottomSheetPortal>
        <BottomSheetOverlay />
        <BottomSheetContent
          snapPoints={mobileSnapPoints}
          defaultSnapIndex={0}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
          enableContentPanningGesture
        >
          {mobilePanel === 'info' ? (
            <BottomSheetScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: sheetPaddingBottom }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {infoDrawer}
            </BottomSheetScrollView>
          ) : null}
          {mobilePanel === 'list' ? (
            <View className="min-h-0 flex-1">{compositionList}</View>
          ) : null}
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
