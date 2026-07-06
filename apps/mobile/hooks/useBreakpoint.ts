import { Platform, useWindowDimensions } from 'react-native';

const DESKTOP_RAIL = 1024;
const TABLET_WIDTH = 768;

/** SideRail outer width (`w-20`) */
export const SIDE_RAIL_WIDTH = 80;

/** Gap between catalog column and detail panel (`gap-4`) */
export const CATALOG_DETAIL_GAP = 16;

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

/** Catalog title: hidden on phones / narrow web, shown on tablet+ web. */
export function useShowCatalogTitle() {
  return useShowSideRail() || useIsTabletWeb();
}

export const CATALOG_MAX_WIDTH = 1400;
export const DETAIL_PANEL_WIDTH = 360;
