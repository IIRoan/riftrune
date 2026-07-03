import { Platform, useWindowDimensions } from 'react-native';

const DESKTOP_RAIL = 1024;

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

export const CATALOG_MAX_WIDTH = 1400;
export const DETAIL_PANEL_WIDTH = 360;
