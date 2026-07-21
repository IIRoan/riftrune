import { describe, expect, test } from 'bun:test';
import type { CardListItem, CardListPrinting } from '@riftbound/contracts';
import {
  attachOwnedToPrintings,
  buildPrintingPickerOptions,
  getOwnedPrintingsForPicker,
  getRemovePrintingPickerOptions,
  resolvePrintingPickerState,
  resolveQuickAddPrintings,
  shouldShowPrintingPicker,
  shouldShowRemovePrintingPicker,
} from '@/utils/collectionPrintingPicker';

const stdFoilPrintings: CardListPrinting[] = [
  {
    variantNumber: 'OGN-253',
    variantLabel: 'Standard',
    isFoil: false,
    priceEur: { currency: 'EUR', low: 1, market: 1.25, avg7d: 1.1, isFoil: false },
  },
  {
    variantNumber: 'OGN-253-Foil',
    variantLabel: 'Standard',
    isFoil: true,
    priceEur: { currency: 'EUR', low: 3, market: 4.5, avg7d: 4, isFoil: true },
  },
];

const runePrintings: CardListPrinting[] = [
  {
    variantNumber: 'SFD-R05',
    variantLabel: 'Standard',
    isFoil: false,
    priceEur: null,
  },
  {
    variantNumber: 'SFD-R05a',
    variantLabel: 'Foil',
    isFoil: true,
    priceEur: null,
  },
];

const multiFamilyPrintings: CardListPrinting[] = [
  ...stdFoilPrintings,
  {
    variantNumber: 'OGN-253-Release',
    variantLabel: 'Release Event Promo',
    isFoil: false,
    priceEur: null,
  },
];

function cardWithPrintings(
  printings: CardListPrinting[],
  variantNumber = printings[0]?.variantNumber ?? 'OGN-253'
): CardListItem {
  return {
    cardId: '11111111-1111-1111-1111-111111111111',
    variantNumber,
    name: 'Test Card',
    type: 'Unit',
    energy: 2,
    might: 2,
    power: 2,
    rarity: 'Rare',
    setCode: 'OGN',
    colors: ['Body'],
    imageUrl: 'https://example.com/card.webp',
    cardmarketId: null,
    priceEur: printings[0]?.priceEur ?? null,
    printings,
    isBanned: false,
  };
}

describe('shouldShowPrintingPicker', () => {
  test('shows picker for std + foil finishes when no variant is pinned', () => {
    expect(shouldShowPrintingPicker(stdFoilPrintings)).toBe(true);
  });

  test('hides picker for a single printing', () => {
    expect(shouldShowPrintingPicker([stdFoilPrintings[0]!])).toBe(false);
  });

  test('hides picker when the active printing row is fixed', () => {
    expect(shouldShowPrintingPicker(stdFoilPrintings, 'OGN-253-Foil')).toBe(false);
  });
});

describe('buildPrintingPickerOptions', () => {
  test('labels std and foil finishes for the add dropdown', () => {
    expect(buildPrintingPickerOptions(stdFoilPrintings)).toEqual([
      {
        id: 'OGN-253',
        label: 'Standard',
        subtitle: 'OGN-253',
        price: '€1.25',
      },
      {
        id: 'OGN-253-Foil',
        label: 'Foil',
        subtitle: 'OGN-253-Foil',
        price: '€4.50',
      },
    ]);
  });
});

describe('owned printing picker helpers', () => {
  test('remove picker only appears when multiple owned finishes exist', () => {
    const printings = attachOwnedToPrintings(stdFoilPrintings, new Map([
      ['OGN-253', { quantity: 1 }],
      ['OGN-253-Foil', { quantity: 2 }],
    ]));

    expect(shouldShowRemovePrintingPicker(printings)).toBe(true);
  });

  test('remove picker stays hidden when only one finish is owned', () => {
    const printings = attachOwnedToPrintings(stdFoilPrintings, new Map([
      ['OGN-253', { quantity: 1 }],
    ]));

    expect(shouldShowRemovePrintingPicker(printings)).toBe(false);
  });

  test('owned helper ignores zero and missing quantities', () => {
    const printings: Array<CardListPrinting & { owned?: number }> = [
      { ...stdFoilPrintings[0]!, owned: 0 },
      { ...stdFoilPrintings[1]!, owned: undefined },
      {
        variantNumber: 'OGN-999',
        variantLabel: 'Standard',
        isFoil: false,
        priceEur: null,
        owned: 2,
      },
    ];

    expect(getOwnedPrintingsForPicker(printings).map((p) => p.variantNumber)).toEqual([
      'OGN-999',
    ]);
  });

  test('remove options only include owned finishes', () => {
    const printings = attachOwnedToPrintings(stdFoilPrintings, new Map([
      ['OGN-253-Foil', { quantity: 1 }],
    ]));
    const allOptions = buildPrintingPickerOptions(stdFoilPrintings);

    expect(getRemovePrintingPickerOptions(printings, allOptions)).toEqual([
      {
        id: 'OGN-253-Foil',
        label: 'Foil',
        subtitle: 'OGN-253-Foil',
        price: '€4.50',
      },
    ]);
  });
});

describe('resolveQuickAddPrintings', () => {
  test('includes std and foil finishes for quick add on catalog cards', () => {
    const card = cardWithPrintings(stdFoilPrintings);

    expect(resolveQuickAddPrintings(card).map((p) => p.variantNumber)).toEqual([
      'OGN-253',
      'OGN-253-Foil',
    ]);
  });

  test('scopes quick add to the selected variant family', () => {
    const card = cardWithPrintings(multiFamilyPrintings);

    expect(resolveQuickAddPrintings(card, 'OGN-253-Release').map((p) => p.variantNumber)).toEqual([
      'OGN-253-Release',
    ]);
  });

  test('defaults to the standard family when promo and alt art also exist', () => {
    const card = cardWithPrintings(multiFamilyPrintings);

    expect(resolveQuickAddPrintings(card).map((p) => p.variantNumber)).toEqual([
      'OGN-253',
      'OGN-253-Foil',
    ]);
  });
});

describe('resolvePrintingPickerState', () => {
  test('enables add picker with both finish options before anything is owned', () => {
    const printings = attachOwnedToPrintings(stdFoilPrintings);

    expect(resolvePrintingPickerState({ printings })).toEqual({
      showAddPicker: true,
      showRemovePicker: false,
      addOptions: buildPrintingPickerOptions(stdFoilPrintings),
      removeOptions: [],
    });
  });

  test('enables remove picker only for finishes the user owns', () => {
    const printings = attachOwnedToPrintings(stdFoilPrintings, new Map([
      ['OGN-253', { quantity: 1 }],
      ['OGN-253-Foil', { quantity: 3 }],
    ]));

    const state = resolvePrintingPickerState({ printings });

    expect(state.showAddPicker).toBe(true);
    expect(state.showRemovePicker).toBe(true);
    expect(state.removeOptions.map((option) => option.id)).toEqual([
      'OGN-253',
      'OGN-253-Foil',
    ]);
  });

  test('pins add/remove to one printing on detail rows', () => {
    const printings = attachOwnedToPrintings(stdFoilPrintings, new Map([
      ['OGN-253-Foil', { quantity: 2 }],
    ]));

    expect(
      resolvePrintingPickerState({
        printings,
        fixedVariantNumber: 'OGN-253-Foil',
      })
    ).toEqual({
      showAddPicker: false,
      showRemovePicker: false,
      addOptions: buildPrintingPickerOptions(stdFoilPrintings),
      removeOptions: [],
    });
  });
});

describe('rune foil sibling quick add', () => {
  test('includes std and foil finishes for SFD-R05 / SFD-R05a cards', () => {
    const card = cardWithPrintings(runePrintings, 'SFD-R05');
    const stepperPrintings = resolveQuickAddPrintings(card);

    expect(stepperPrintings.map((p) => p.variantNumber)).toEqual(['SFD-R05', 'SFD-R05a']);
    expect(shouldShowPrintingPicker(stepperPrintings)).toBe(true);
  });
});
