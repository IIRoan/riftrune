import { describe, expect, test } from 'bun:test';
import {
  GRID_CARD_TITLE_LINES,
  GRID_CARD_TITLE_LINE_HEIGHT,
  GRID_CARD_TITLE_MIN_HEIGHT,
  gridCardTitleStyle,
} from '@/lib/cardTileGridTitle';

describe('grid card title layout', () => {
  test('reserves exactly two lines of height', () => {
    expect(GRID_CARD_TITLE_MIN_HEIGHT).toBe(
      GRID_CARD_TITLE_LINE_HEIGHT * GRID_CARD_TITLE_LINES
    );
    expect(gridCardTitleStyle().minHeight).toBe(36);
  });

  test('line height is fixed for consistent row alignment', () => {
    expect(gridCardTitleStyle().lineHeight).toBe(GRID_CARD_TITLE_LINE_HEIGHT);
  });
});
