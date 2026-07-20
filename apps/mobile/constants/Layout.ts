/**
 * Numeric layout constants for APIs that require raw numbers instead of
 * Uniwind `className` tokens (e.g. FlatList `columnWrapperStyle`/`contentContainerStyle`).
 */

export const Layout = {
  screenPaddingHorizontal: 16,
  /** Horizontal inset when desktop SideRail is visible (px). */
  screenPaddingHorizontalRail: 8,
  gridGap: 16,
  /** Floating tab bar height (px). */
  tabBarHeight: 56,
  /** Gap between tab bar and home indicator / screen edge. */
  tabBarBottomMargin: 12,
  /** Horizontal inset for the floating tab bar pill. */
  tabBarHorizontalInset: 16,
  tabBarMaxWidth: 400,
  /** Minimum touch target per HIG / Material (px). */
  minTouchTarget: 44,
} as const;

/** Scroll content padding so the last row clears the floating tab bar. */
export function tabBarContentInset(bottomSafeArea: number): number {
  return (
    Layout.tabBarHeight +
    Layout.tabBarBottomMargin +
    Math.max(bottomSafeArea, Layout.tabBarBottomMargin) +
    16
  );
}
