import { Platform } from 'react-native';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
} from '@/components/ui/bottom-sheet';
import { useTheme } from '@/context/ThemeContext';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CardDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Mobile card detail — full-height swipe-to-dismiss sheet with scrollable body. */
export function CardDetailDrawer({ open, onClose, children }: CardDetailDrawerProps) {
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  // Single tall snap (same pattern as filters). Dual mid/expanded snaps left the
  // sheet half-open and fought vertical scroll for price history below the fold.
  const snapPoints = ['94%'];
  const paddingBottom = Math.max(insets.bottom, 16) + 32;
  // Carbon panel on dark (clear lift off obsidian); card surface on light.
  const sheetSurface = isDark ? 'bg-card-panel' : 'bg-card';

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <BottomSheetPortal>
        {/* Denser dark scrim so the carbon sheet reads as a raised drawer. */}
        <BottomSheetOverlay maxOpacity={isDark ? 0.88 : undefined} />
        <BottomSheetContent
          snapPoints={snapPoints}
          defaultSnapIndex={0}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
          enableContentPanningGesture
          // Freer downward drag than Gorhom’s 2.5 default — dismiss with a short pull.
          overDragResistanceFactor={1.15}
          activeOffsetY={Platform.OS === 'web' ? 4 : 6}
          backgroundClassName={`border-t border-border ${sheetSurface}`}
          handleClassName={isDark ? 'bg-foreground/45' : 'bg-muted-foreground/70'}
          handleSurfaceClassName={sheetSurface}
          handleDivider
        >
          <BottomSheetScrollView
            className={`min-h-0 flex-1 ${sheetSurface}`}
            contentContainerStyle={{
              paddingHorizontal: 0,
              paddingBottom,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={!reduceMotion}
          >
            {children}
          </BottomSheetScrollView>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
