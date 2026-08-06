import { useEffect, useRef, useState } from 'react';
import {
  type SharedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { MOTION, OVERLAY_CLOSE, SHEET_REDUCED, SHEET_SPRING } from '@/lib/motion';

type OverlayPresence = {
  /** True while the overlay should stay in the tree (includes exit animation). */
  visible: boolean;
  /** 0 = hidden, 1 = fully presented. */
  progress: SharedValue<number>;
  reduceMotion: boolean;
};

/**
 * Enter/exit progress for centered dialogs and card modals.
 * Open → MOTION.smooth spring (or opacity timing when reduced motion).
 * Close → snappy timing, then unmount via `visible`.
 */
export function useOverlayPresence(open: boolean): OverlayPresence {
  const reduceMotion = useReduceMotion();
  const [visible, setVisible] = useState(open);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setVisible(true);
      progress.value = 0;
      const frame = requestAnimationFrame(() => {
        progress.value = reduceMotion
          ? withTiming(1, SHEET_REDUCED)
          : withSpring(1, SHEET_SPRING);
      });
      return () => cancelAnimationFrame(frame);
    }

    progress.value = withTiming(0, OVERLAY_CLOSE, (finished) => {
      if (finished) {
        scheduleOnRN(setVisible, false);
      }
    });
  }, [open, progress, reduceMotion]);

  return { visible, progress, reduceMotion };
}

/** One-shot entrance when a route-mounted overlay appears (exit owned by navigator). */
export function useOverlayEnterProgress(): {
  progress: SharedValue<number>;
  reduceMotion: boolean;
} {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);
  // Freeze a11y preference at mount so the enter effect stays one-shot.
  const reduceMotionOnEnter = useRef(reduceMotion).current;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      progress.value = reduceMotionOnEnter
        ? withTiming(1, SHEET_REDUCED)
        : withSpring(1, MOTION.smooth);
    });
    return () => cancelAnimationFrame(frame);
  }, [progress, reduceMotionOnEnter]);

  return { progress, reduceMotion };
}
