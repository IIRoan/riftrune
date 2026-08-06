/**
 * App-wide motion palette — Reanimated springs matched to Apple snappy/smooth/bouncy.
 * Use for state feedback and navigation polish. Gate scale/translate behind `useReduceMotion`.
 */

import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';
import { Easing } from 'react-native-reanimated';

export const MOTION = {
  /** Arrivals, score ticks, tab indicator — mass=1, stiffness=400, damping=30 */
  snappy: { stiffness: 400, damping: 30, mass: 1 },
  /** Spatial settles (sheets, banners) — mass=1, stiffness=200, damping=24 */
  smooth: { stiffness: 200, damping: 24, mass: 1 },
  /** Press release / micro pops — mass=1, stiffness=500, damping=18 */
  bouncy: { stiffness: 500, damping: 18, mass: 1 },
} as const;

/** Functional press depth (no spring overshoot while held). */
export const PRESS = {
  depth: 0.97,
  activeDepth: 0.94,
  inMs: 90,
  outSpring: MOTION.bouncy,
} as const;

/** Tab / screen crossfade timing when spring specs aren't available. */
export const FADE_TRANSITION = {
  durationMs: 220,
} as const;

/** Ambient pulse loops (final-point cue, etc.). */
export const PULSE_MS = 1400;

/**
 * Overlay / sheet / dialog choreography.
 * Open: spring-smooth spatial settle. Close: snappy decel (no bounce past closed).
 * Reduced motion: opacity-only fades — no scale/translate.
 */
export const OVERLAY = {
  /** Content starts slightly small + below, settles into place. */
  enterScale: 0.96,
  enterY: 12,
  /** Backdrop target opacities (light / dark). */
  backdropLight: 0.5,
  backdropDark: 0.75,
  /** Card modal uses a denser scrim. */
  backdropCard: 0.85,
  /** Keep portal mounted until close settle finishes. */
  unmountMs: 520,
  closeMs: 220,
  closeEasing: Easing.out(Easing.cubic),
} as const;

/** Gorhom / Reanimated spring for drawer + bottom-sheet open/snap. */
export const SHEET_SPRING: WithSpringConfig = {
  ...MOTION.smooth,
  overshootClamping: false,
};

/** Reduced-motion sheet/dialog: short opacity-friendly timing. */
export const SHEET_REDUCED: WithTimingConfig = {
  duration: FADE_TRANSITION.durationMs,
  easing: OVERLAY.closeEasing,
};

/** Dialog / modal close — timing so the panel doesn't bounce off-screen. */
export const OVERLAY_CLOSE: WithTimingConfig = {
  duration: OVERLAY.closeMs,
  easing: OVERLAY.closeEasing,
};

/** @deprecated Prefer MOTION — kept for play-scoreboard call sites. */
export const PLAY_SPRINGS = MOTION;
/** @deprecated Prefer PRESS */
export const PLAY_PRESS = {
  depth: PRESS.depth,
  activeDepth: PRESS.activeDepth,
  durationMs: PRESS.inMs,
} as const;
/** @deprecated Prefer PULSE_MS */
export const PLAY_PULSE_MS = PULSE_MS;
