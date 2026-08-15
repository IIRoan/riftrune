export const RUNE_SIZE_PX = {
  sm: 22,
  md: 40,
  lg: 64,
  xl: 96,
} as const;

export type RuneChargeSize = keyof typeof RUNE_SIZE_PX;

/** Full-screen boot / dispatch mark — lg on very small phones, xl otherwise. */
export function runeSizeForShortSide(shortSide: number): RuneChargeSize {
  return shortSide < 360 ? 'lg' : 'xl';
}
