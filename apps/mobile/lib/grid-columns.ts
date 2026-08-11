/** Preferred upper bound for catalog / picker grid tiles (px). */
export const GRID_TILE_MAX_WIDTH = 148;
/** Floor so dense grids stay readable and tappable (px). */
export const GRID_TILE_MIN_WIDTH = 96;

const MIN_GRID_COLUMNS = 2;
const MAX_GRID_COLUMNS = 12;

/**
 * Pack columns so filled tile width stays ≤ {@link GRID_TILE_MAX_WIDTH}.
 * Uses ceil so mid-widths gain columns instead of stretching cards past the max
 * (phones stay ~3-up; tablets pick up 4–6+).
 */
export function computeMaxCappedGridColumns(
  available: number,
  gap: number,
  maxTileWidth = GRID_TILE_MAX_WIDTH,
  minTileWidth = GRID_TILE_MIN_WIDTH
): number {
  if (available <= 0) return MIN_GRID_COLUMNS;

  let numColumns = Math.ceil((available + gap) / (maxTileWidth + gap));
  numColumns = Math.max(MIN_GRID_COLUMNS, Math.min(MAX_GRID_COLUMNS, numColumns));

  while (
    numColumns > MIN_GRID_COLUMNS &&
    (available - gap * (numColumns - 1)) / numColumns < minTileWidth
  ) {
    numColumns -= 1;
  }

  return numColumns;
}
