const IDENTITY_GAP = 12;
/** Space reserved so the rune summary can sit beside legend/champion. */
const RUNE_COLUMN_RESERVE = 176;
const IDENTITY_TILE_MIN = 96;
/**
 * Phone / stacked-runes showcase — match catalog tile scale (not half-screen heroes).
 * Wide desktop may grow toward IDENTITY_TILE_MAX.
 */
const IDENTITY_TILE_MAX_NARROW = 120;
/** Allow legend/champion to grow larger than catalog tiles on wide desktop. */
const IDENTITY_TILE_MAX = 200;
/** Below this width (or when runes stack under), keep identity tiles compact. */
const IDENTITY_WIDE_MIN_WIDTH = 480;

/** Legend + champion tile width — fills the identity row without starving the rune column. */
export function computeShowcaseIdentityTileWidth(
  contentWidth: number,
  reserveRuneColumn: boolean
): number {
  if (contentWidth <= 0) return IDENTITY_TILE_MIN;
  const reserved = reserveRuneColumn
    ? RUNE_COLUMN_RESERVE + IDENTITY_GAP * 2
    : IDENTITY_GAP;
  const perTile = Math.floor(Math.max(0, contentWidth - reserved) / 2);
  const max =
    reserveRuneColumn && contentWidth >= IDENTITY_WIDE_MIN_WIDTH
      ? IDENTITY_TILE_MAX
      : IDENTITY_TILE_MAX_NARROW;
  return Math.max(IDENTITY_TILE_MIN, Math.min(max, perTile));
}
