import { describe, expect, test } from 'bun:test';
import {
  deckBrowseFiltersToQuery,
  DEFAULT_DECK_BROWSE_FILTERS,
} from '@/constants/deckBrowse';

describe('deckBrowseFiltersToQuery', () => {
  test('maps active filters to API query params', () => {
    expect(
      deckBrowseFiltersToQuery({
        ...DEFAULT_DECK_BROWSE_FILTERS,
        legend: 'Vex, Empress of the Void',
        sets: ['OGN', 'SFD'],
        isLegal: true,
        hasGuide: true,
        hasVideo: false,
        hasMatchups: true,
      })
    ).toEqual({
      legend: 'Vex, Empress of the Void',
      sets: 'OGN,SFD',
      isLegal: true,
      hasGuide: true,
      hasMatchups: true,
    });
  });

  test('omits inactive filters', () => {
    expect(deckBrowseFiltersToQuery(DEFAULT_DECK_BROWSE_FILTERS)).toEqual({});
  });
});
