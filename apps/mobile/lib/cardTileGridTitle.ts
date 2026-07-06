export const GRID_CARD_TITLE_FONT_SIZE = 13;
export const GRID_CARD_TITLE_LINE_HEIGHT = 18;
export const GRID_CARD_TITLE_LINES = 2;
export const GRID_CARD_TITLE_MIN_HEIGHT =
  GRID_CARD_TITLE_LINE_HEIGHT * GRID_CARD_TITLE_LINES;

export function gridCardTitleStyle() {
  return {
    fontSize: GRID_CARD_TITLE_FONT_SIZE,
    lineHeight: GRID_CARD_TITLE_LINE_HEIGHT,
    minHeight: GRID_CARD_TITLE_MIN_HEIGHT,
  } as const;
}
