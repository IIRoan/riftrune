import { describe, expect, test } from 'bun:test';
import {
  RIFTBOUND_DECK_RULES,
  DeckRulesResponse,
  DeckValidateInput,
  validateRiftboundDeck,
} from './deck-rules.js';

const jinxLegend = {
  cardId: 'legend-1',
  variantNumber: 'OGN-251',
  name: 'Jinx - Loose Cannon',
  type: 'Legend',
  super: null,
  tags: ['Jinx'],
  colors: ['Fury', 'Chaos'],
  energy: 0,
  setCode: 'OGN',
  rarity: 'Rare',
  variantType: 'Standard',
  isSignature: false,
};

const jinxChampion = {
  cardId: 'champ-1',
  variantNumber: 'OGN-100',
  name: 'Jinx - Demolitionist',
  type: 'Unit',
  super: 'Champion',
  tags: ['Jinx'],
  colors: ['Fury'],
  energy: 3,
  setCode: 'OGN',
  rarity: 'Rare',
  variantType: 'Standard',
  isSignature: false,
};

const furyRune = {
  cardId: 'rune-1',
  variantNumber: 'OGN-R01',
  name: 'Fury Rune',
  type: 'Rune',
  super: null,
  tags: [],
  colors: ['Fury'],
  energy: 0,
  setCode: 'OGN',
  rarity: 'Common',
  variantType: 'Standard',
  isSignature: false,
};

const battlefield = {
  cardId: 'bf-1',
  variantNumber: 'OGN-B01',
  name: 'Zaun Warrens',
  type: 'Battlefield',
  super: null,
  tags: [],
  colors: ['Chaos'],
  energy: 0,
  setCode: 'OGN',
  rarity: 'Uncommon',
  variantType: 'Standard',
  isSignature: false,
};

describe('RIFTBOUND_DECK_RULES', () => {
  test('exposes canonical section targets', () => {
    expect(RIFTBOUND_DECK_RULES.sections.legend.target).toBe(1);
    expect(RIFTBOUND_DECK_RULES.sections.champion.target).toBe(1);
    expect(RIFTBOUND_DECK_RULES.sections.mainDeck.target).toBe(39);
    expect(RIFTBOUND_DECK_RULES.sections.runes.target).toBe(12);
    expect(RIFTBOUND_DECK_RULES.sections.battlefields.target).toBe(3);
    expect(RIFTBOUND_DECK_RULES.sections.sideboard.target).toBe(8);
  });

  test('DeckRulesResponse schema matches contract shape', () => {
    const payload = {
      data: {
        version: RIFTBOUND_DECK_RULES.version,
        rules: RIFTBOUND_DECK_RULES,
      },
    };
    expect(() => DeckRulesResponse.parse(payload)).not.toThrow();
  });
});

describe('validateRiftboundDeck', () => {
  test('requires legend and champion', () => {
    const input = DeckValidateInput.parse({
      legend: null,
      champion: null,
      mainDeck: [],
      runes: [],
      battlefields: [],
      sideboard: [],
    });

    const messages = validateRiftboundDeck(input);
    expect(messages.some((m) => m.code === 'missing_legend')).toBe(true);
    expect(messages.some((m) => m.code === 'missing_champion')).toBe(true);
  });

  test('requires champion tag match', () => {
    const input = DeckValidateInput.parse({
      legend: jinxLegend,
      champion: {
        ...jinxChampion,
        name: 'Ahri - Nine-Tailed Fox',
        tags: ['Ahri'],
      },
      mainDeck: [],
      runes: [],
      battlefields: [],
      sideboard: [],
    });

    const messages = validateRiftboundDeck(input);
    expect(messages.some((m) => m.code === 'champion_tag_mismatch')).toBe(true);
  });

  test('accepts Darius legend and champion when tags are domain-only', () => {
    const dariusLegend = {
      ...jinxLegend,
      name: 'Darius, Hand of Noxus',
      tags: ['Noxus', 'Fury', 'Order'],
      colors: ['Fury', 'Order'],
    };
    const dariusChampion = {
      ...jinxChampion,
      name: 'Darius, Executioner',
      tags: ['Noxus', 'Fury'],
      colors: ['Fury'],
    };

    const input = DeckValidateInput.parse({
      legend: dariusLegend,
      champion: dariusChampion,
      mainDeck: [],
      runes: [],
      battlefields: [],
      sideboard: [],
    });

    const messages = validateRiftboundDeck(input);
    expect(messages.some((m) => m.code === 'champion_tag_mismatch')).toBe(false);
  });

  test('warns when rune total is not 12', () => {
    const input = DeckValidateInput.parse({
      legend: jinxLegend,
      champion: jinxChampion,
      mainDeck: [],
      runes: [{ card: furyRune, count: 8 }],
      battlefields: [],
      sideboard: [],
    });

    const messages = validateRiftboundDeck(input);
    expect(messages.some((m) => m.code === 'rune_count')).toBe(true);
  });

  test('validates a complete deck', () => {
    const mainDeck = Array.from({ length: 39 }, (_, i) => ({
      card: {
        ...jinxChampion,
        cardId: `main-${i}`,
        name: `Main Card ${i}`,
        super: null,
        type: 'Unit',
        isSignature: false,
      },
      count: 1,
    }));

    const input = DeckValidateInput.parse({
      legend: jinxLegend,
      champion: jinxChampion,
      mainDeck,
      runes: [{ card: furyRune, count: 12 }],
      battlefields: [
        { card: battlefield, count: 1 },
        {
          card: { ...battlefield, cardId: 'bf-2', name: 'Reaver Row', variantNumber: 'OGN-B02' },
          count: 1,
        },
        {
          card: { ...battlefield, cardId: 'bf-3', name: 'The Arena', variantNumber: 'OGN-B03' },
          count: 1,
        },
      ],
      sideboard: [],
    });

    const messages = validateRiftboundDeck(input);
    expect(messages).toEqual([{ type: 'valid', code: 'deck_valid', message: 'Deck is valid!' }]);
  });
});
