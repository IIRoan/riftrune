import { useCallback, useMemo, useRef } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GorhomBottomSheet, {
  BottomSheetScrollView,
  type BottomSheetBackgroundProps,
} from '@gorhom/bottom-sheet';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { OVERLAY, SHEET_REDUCED, SHEET_SPRING } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface CardDetailDrawerProps {
  onClose: () => void;
  children: React.ReactNode;
}

const SHEET_RADIUS = 20;
/** animatedIndex drops below this when Gorhom commits to pan-down close. */
const DISMISS_INDEX = -0.12;

/**
 * Mobile card detail — Gorhom sheet without the app Portal.
 *
 * Critical: clear selection / unmount as soon as dismiss is committed
 * (backdrop press or pan past close threshold). Waiting for Gorhom’s
 * onClose (post-animation) leaves a full-screen host eating catalog taps.
 */
export function CardDetailDrawer({ onClose, children }: CardDetailDrawerProps) {
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const closedRef = useRef(false);
  const animatedIndex = useSharedValue(0);

  const snapPoints = useMemo(() => ['94%'], []);
  const paddingBottom = Math.max(insets.bottom, 16) + 32;
  const topInset = Math.max(insets.top, 12) + 16;
  const sheetSurface = isDark ? 'bg-card-panel' : 'bg-card';
  const backdropOpacity = isDark ? 0.88 : OVERLAY.backdropDark;
  const animationConfigs = reduceMotion ? SHEET_REDUCED : SHEET_SPRING;

  const dismiss = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  }, [onClose]);

  // Pan-down: Gorhom’s onClose waits for the spring to finish (~1s). Unmount
  // as soon as the index crosses into “closing” so catalog taps work again.
  useAnimatedReaction(
    () => animatedIndex.value,
    (index, prev) => {
      if (prev == null) return;
      // Opening: -1 → 0. Ignore. Closing from open (≈0) toward -1.
      if (prev > DISMISS_INDEX && index <= DISMISS_INDEX) {
        runOnJS(dismiss)();
      }
    },
    [dismiss]
  );

  const renderBackground = useCallback(
    (props: BottomSheetBackgroundProps) => (
      <View
        {...props}
        className={cn('border-t border-border', sheetSurface)}
        style={[
          props.style,
          {
            borderTopLeftRadius: SHEET_RADIUS,
            borderTopRightRadius: SHEET_RADIUS,
          },
        ]}
      />
    ),
    [sheetSurface]
  );

  const renderHandle = useCallback(
    () => (
      <View
        className={cn('items-center justify-center border-b border-border', sheetSurface)}
        style={{ paddingTop: 10, paddingBottom: 8 }}
      >
        <View
          className={cn(
            'h-1 w-12 rounded-[3px]',
            isDark ? 'bg-foreground/45' : 'bg-muted-foreground/70'
          )}
        />
      </View>
    ),
    [isDark, sheetSurface]
  );

  const sheet = (
    <GestureHandlerRootView style={styles.flex} pointerEvents="box-none">
      <View style={[styles.flex, { height: windowHeight }]} pointerEvents="box-none">
        {/* Instant backdrop — do not use Gorhom backdrop pressBehavior="close"
            (that waits for the sheet animation before our tree unmounts). */}
        <Pressable
          accessibilityLabel="Close card detail"
          accessibilityRole="button"
          onPress={dismiss}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: backdropOpacity }]}
        />
        <GorhomBottomSheet
          index={0}
          snapPoints={snapPoints}
          topInset={topInset}
          animatedIndex={animatedIndex}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
          enableContentPanningGesture
          enableDynamicSizing={false}
          animateOnMount
          animationConfigs={animationConfigs}
          overDragResistanceFactor={1.15}
          activeOffsetY={Platform.OS === 'web' ? 4 : 6}
          backgroundComponent={renderBackground}
          handleComponent={renderHandle}
          style={styles.sheetContainer}
          onAnimate={(_from, to) => {
            if (to === -1) dismiss();
          }}
          onClose={dismiss}
        >
          <BottomSheetScrollView
            className={cn('min-h-0 flex-1', sheetSurface)}
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
        </GorhomBottomSheet>
      </View>
    </GestureHandlerRootView>
  );

  if (Platform.OS === 'web') {
    return (
      <View
        accessibilityViewIsModal
        className="fixed inset-0 z-[200]"
        pointerEvents="box-none"
        style={styles.flex}
      >
        {sheet}
      </View>
    );
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={dismiss}
    >
      {sheet}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // Let taps outside the sheet chrome pass through once backdrop is gone.
  sheetContainer: {
    pointerEvents: 'box-none',
  },
});
