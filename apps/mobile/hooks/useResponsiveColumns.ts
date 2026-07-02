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

function computeGridLayout(contentWidth: number) {
  const horizontalPad = Layout.screenPaddingHorizontal * 2;
  const gap = Layout.gridGap;
  const available = contentWidth - horizontalPad;

  let numColumns = Math.max(
    MIN_GRID_COLUMNS,
    Math.floor((available + gap) / (GRID_TILE_MAX_WIDTH + gap))
  );
  numColumns = Math.min(MAX_GRID_COLUMNS, numColumns);

  const minForEight =
    TARGET_GRID_COLUMNS * GRID_TILE_MAX_WIDTH + (TARGET_GRID_COLUMNS - 1) * gap;
  if (available >= minForEight) {
    numColumns = Math.max(TARGET_GRID_COLUMNS, numColumns);
  }

  let tileWidth = (available - gap * (numColumns - 1)) / numColumns;
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

export function useResponsiveColumns(layout: 'grid' | 'list') {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const contentWidth = Math.min(width, DESKTOP_MAX_WIDTH);

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

    const grid = computeGridLayout(contentWidth);
    return {
      contentWidth,
      listMaxWidth: LIST_MAX_WIDTH,
      compact: grid.tileWidth < 160,
      ...grid,
    };
  }, [layout, width]);
}

export function useIsDesktopLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 768;
}
