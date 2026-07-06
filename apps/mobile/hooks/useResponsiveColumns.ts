import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Layout } from '@/constants/Layout';
import { useMobileLayout } from '@/hooks/useBreakpoint';

export const GRID_TILE_MAX_WIDTH = 148;
const GRID_TILE_MIN_WIDTH = 96;
const MIN_GRID_COLUMNS = 2;
const MAX_GRID_COLUMNS = 12;
const TARGET_GRID_COLUMNS = 8;
const MOBILE_GRID_COLUMNS = 3;
const DESKTOP_MAX_WIDTH = 1600;
const LIST_MAX_WIDTH = 640;

function computeGridLayout(
  contentWidth: number,
  fillAvailable = false,
  subtractScreenPadding = true
) {
  const horizontalPad = subtractScreenPadding ? Layout.screenPaddingHorizontal * 2 : 0;
  const gap = Layout.gridGap;
  const available = contentWidth - horizontalPad;

  let numColumns = Math.max(
    MIN_GRID_COLUMNS,
    Math.floor((available + gap) / (GRID_TILE_MAX_WIDTH + gap))
  );
  numColumns = Math.min(MAX_GRID_COLUMNS, numColumns);

  if (!fillAvailable) {
    const minForEight =
      TARGET_GRID_COLUMNS * GRID_TILE_MAX_WIDTH + (TARGET_GRID_COLUMNS - 1) * gap;
    if (available >= minForEight) {
      numColumns = Math.max(TARGET_GRID_COLUMNS, numColumns);
    }
  }

  let tileWidth = (available - gap * (numColumns - 1)) / numColumns;

  if (fillAvailable) {
    tileWidth = Math.max(GRID_TILE_MIN_WIDTH, tileWidth);
    return { numColumns, tileWidth, gap };
  }

  if (tileWidth > GRID_TILE_MAX_WIDTH) {
    numColumns = Math.max(
      MIN_GRID_COLUMNS,
      Math.floor((available + gap) / (GRID_TILE_MAX_WIDTH + gap))
    );
    tileWidth = (available - gap * (numColumns - 1)) / numColumns;
  }

  tileWidth = Math.max(GRID_TILE_MIN_WIDTH, Math.min(GRID_TILE_MAX_WIDTH, tileWidth));

  return { numColumns, tileWidth, gap };
}

type ResponsiveColumnOptions = {
  /** Pixels to subtract from window width (side rail, detail panel, outer gutters). */
  reservedWidth?: number;
  /** Measured catalog column width — used in split layout for accurate column math. */
  measuredWidth?: number | null;
  /** Expand tiles to fill the measured column (split catalog + detail layout). */
  fillAvailable?: boolean;
};

export function useResponsiveColumns(
  layout: 'grid' | 'list',
  options?: ResponsiveColumnOptions
) {
  const { width } = useWindowDimensions();
  const isMobile = useMobileLayout();
  const reservedWidth = options?.reservedWidth ?? 0;
  const measuredWidth = options?.measuredWidth;
  const fillAvailable = options?.fillAvailable ?? false;

  return useMemo(() => {
    const isMeasured = measuredWidth != null && measuredWidth > 0;
    const contentWidth = isMeasured
      ? measuredWidth
      : Math.max(320, Math.min(width, DESKTOP_MAX_WIDTH) - reservedWidth);
    const subtractScreenPadding = !isMeasured;

    if (layout === 'list') {
      const horizontalPad = subtractScreenPadding ? Layout.screenPaddingHorizontal * 2 : 0;
      return {
        numColumns: 1,
        contentWidth,
        tileWidth: Math.min(contentWidth - horizontalPad, LIST_MAX_WIDTH),
        gap: Layout.gridGap,
        listMaxWidth: LIST_MAX_WIDTH,
        compact: false,
      };
    }

    if (isMobile && Platform.OS !== 'web') {
      const horizontalPad = subtractScreenPadding ? Layout.screenPaddingHorizontal * 2 : 0;
      const gap = Layout.gridGap;
      const available = contentWidth - horizontalPad;

      let numColumns = MOBILE_GRID_COLUMNS;
      const minWidthTotal =
        numColumns * GRID_TILE_MIN_WIDTH + (numColumns - 1) * gap;
      if (minWidthTotal > available) {
        numColumns = Math.max(
          MIN_GRID_COLUMNS,
          Math.floor((available + gap) / (GRID_TILE_MIN_WIDTH + gap))
        );
      }

      let tileWidth = (available - gap * (numColumns - 1)) / numColumns;
      const minClamped = Math.max(GRID_TILE_MIN_WIDTH, tileWidth);
      const minRowWidth = numColumns * minClamped + (numColumns - 1) * gap;
      if (minRowWidth <= available) {
        tileWidth = minClamped;
      }

      return {
        numColumns,
        contentWidth,
        tileWidth,
        gap,
        listMaxWidth: LIST_MAX_WIDTH,
        compact: true,
      };
    }

    const grid = computeGridLayout(contentWidth, fillAvailable, subtractScreenPadding);
    return {
      contentWidth,
      listMaxWidth: LIST_MAX_WIDTH,
      compact: grid.tileWidth < 160,
      ...grid,
    };
  }, [layout, width, reservedWidth, measuredWidth, fillAvailable, isMobile]);
}

export function useIsDesktopLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 768;
}
