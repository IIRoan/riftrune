import { tabBarContentInset } from '@/constants/Layout';

/** Extra list padding below the home indicator when the floating tab bar is hidden. */
const HIDDEN_TAB_BAR_LIST_PAD = 16;

/** Hide floating tab bar on desktop rail, card modals, Play, and deep deck routes (edge-to-edge). */
export function mobileTabBarVisible(pathname: string, showRail: boolean): boolean {
  if (showRail) return false;
  if (pathname.startsWith('/card/')) return false;
  if (pathname === '/play' || pathname.startsWith('/play/')) return false;
  if (pathname.startsWith('/decks/') && pathname !== '/decks/browse') return false;
  return true;
}

/** Scroll/list bottom inset: tab-bar clearance, or safe-area only when the bar is gone. */
export function listBottomInset(
  bottomSafeArea: number,
  tabBarVisible: boolean
): number {
  if (!tabBarVisible) {
    return Math.max(bottomSafeArea, 12) + HIDDEN_TAB_BAR_LIST_PAD;
  }
  return tabBarContentInset(bottomSafeArea);
}
