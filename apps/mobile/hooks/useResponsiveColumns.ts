import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Layout } from '@/constants/Layout';

export const GRID_TILE_MAX_WIDTH = 148;
const GRID_TILE_MIN_WIDTH = 96;
const MIN_GRID_COLUMNS = 2;
const MAX_GRID_COLUMNS = 12;
const TARGET_GRID_COLUMNS = 8;
const DESKTOP_MAX_WIDTH = 1600;
const LIST_MAX_WIDTH = 640;

function computeGridLayout(contentWidth: number, fillAvailable = false) {
  const horizontalPad = Layout.screenPaddingHorizontal * 2;
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
  const reservedWidth = options?.reservedWidth ?? 0;
  const measuredWidth = options?.measuredWidth;
  const fillAvailable = options?.fillAvailable ?? false;

  return useMemo(() => {
    const contentWidth =
      measuredWidth != null && measuredWidth > 0
        ? measuredWidth
        : Math.max(320, Math.min(width, DESKTOP_MAX_WIDTH) - reservedWidth);

    if (layout === 'list') {
      return {
        numColumns: 1,
        contentWidth,
        tileWidth: Math.min(contentWidth - Layout.screenPaddingHorizontal * 2, LIST_MAX_WIDTH),
        gap: Layout.gridGap,
        listMaxWidth: LIST_MAX_WIDTH,
        compact: false,
      };
    }

    const grid = computeGridLayout(contentWidth, fillAvailable);
    return {
      contentWidth,
      listMaxWidth: LIST_MAX_WIDTH,
      compact: grid.tileWidth < 160,
      ...grid,
    };
  }, [layout, width, reservedWidth, measuredWidth, fillAvailable]);
}

export function useIsDesktopLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 768;
}
