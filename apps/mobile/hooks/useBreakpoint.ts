import { Platform, useWindowDimensions } from 'react-native';
import { Layout } from '@/constants/Layout';

const DESKTOP_RAIL = 1024;
const TABLET_WIDTH = 768;

/** SideRail column width (`pl` gutter + `w-12` card; flush to content) */
export const SIDE_RAIL_WIDTH = Layout.screenPaddingHorizontalRail + 48;

/** Gap between catalog column and detail panel — same as rail shell gutter. */
export const CATALOG_DETAIL_GAP = Layout.screenPaddingHorizontalRail;

export function useShowSideRail() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_RAIL;
}

export function useCatalogSplitLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_RAIL;
}

/** Native phones and narrow web — bottom tab bar, single-column layouts. */
export function useMobileLayout() {
  return !useShowSideRail();
}

export function useIsTabletWeb() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= TABLET_WIDTH && width < DESKTOP_RAIL;
}

export const DETAIL_PANEL_WIDTH = 360;
