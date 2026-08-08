import { Layout } from '@/constants/Layout';

/** FlashList style for catalog card grids (negative margin cancels outer cell padding). */
export function catalogGridListStyle() {
  return { flex: 1 as const, marginHorizontal: -Layout.gridGap / 2 };
}

/** Per-tile wrapper used by FlashList grid cells. */
export function catalogGridCellStyle() {
  return {
    paddingHorizontal: Layout.gridGap / 2,
    marginBottom: Layout.gridGap,
  };
}

/** Skeleton / manual grid cell — matches FlashList column width for a given tile. */
export function catalogGridSkeletonCellStyle(tileWidth: number) {
  return {
    width: tileWidth + Layout.gridGap,
    paddingHorizontal: Layout.gridGap / 2,
    marginBottom: Layout.gridGap,
  };
}

export function catalogGridTileStyle(tileWidth: number) {
  return { width: tileWidth };
}
