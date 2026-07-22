import { describe, expect, test } from 'bun:test';
import { deckEditHref, deckViewHref, isDeckEditMode } from '@/lib/deck-navigation';

describe('deck-navigation', () => {
  test('view and edit hrefs', () => {
    expect(deckViewHref('abc')).toBe('/decks/abc');
    expect(deckEditHref('abc')).toBe('/decks/abc?mode=edit');
  });

  test('isDeckEditMode', () => {
    expect(isDeckEditMode('edit')).toBe(true);
    expect(isDeckEditMode(undefined)).toBe(false);
    expect(isDeckEditMode('view')).toBe(false);
    expect(isDeckEditMode(['edit'])).toBe(true);
    expect(isDeckEditMode(['view', 'edit'])).toBe(false);
  });
});
