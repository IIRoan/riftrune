const IDENTITY_GAP = 12;
/** Space reserved so the rune summary can sit beside legend/champion. */
const RUNE_COLUMN_RESERVE = 176;
const IDENTITY_TILE_MIN = 96;
/** Allow legend/champion to grow larger than catalog tiles on wide desktop. */
const IDENTITY_TILE_MAX = 200;

/** Legend + champion tile width — fills the identity row without starving the rune column. */
export function computeShowcaseIdentityTileWidth(
  contentWidth: number,
  reserveRuneColumn: boolean
): number {
  if (contentWidth <= 0) return 128;
  const reserved = reserveRuneColumn
    ? RUNE_COLUMN_RESERVE + IDENTITY_GAP * 2
    : IDENTITY_GAP;
  const perTile = Math.floor(Math.max(0, contentWidth - reserved) / 2);
  return Math.max(IDENTITY_TILE_MIN, Math.min(IDENTITY_TILE_MAX, perTile));
}
