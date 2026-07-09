import { legendRuneDomains as contractLegendRuneDomains } from '@riftbound/contracts';
import type { DeckCard, DeckEntry } from '@/lib/deck-types';

/** Default column count when responsive layout is unavailable. */
export const DECK_GRID_COLUMNS = 3;

export type DeckGridCardCell = {
  kind: 'card';
  name: string;
  entry: DeckEntry;
};

export type DeckGridAddCell = {
  kind: 'add';
};

export type DeckGridEmptyCell = {
  kind: 'empty';
};

export type DeckGridCell = DeckGridCardCell | DeckGridAddCell | DeckGridEmptyCell;

export type BattlefieldSlot = DeckEntry | null;

export function getLegendRuneDomains(legend: Pick<DeckCard, 'colors'>): [string, string] {
  return contractLegendRuneDomains(legend);
}

export function countRunesForDomain(
  runes: ReadonlyMap<string, DeckEntry>,
  domain: string
): number {
  let total = 0;
  for (const [, entry] of runes) {
    if (entry.card.colors.includes(domain)) {
      total += entry.count;
    }
  }
  return total;
}

export function buildBattlefieldSlots(
  battlefields: ReadonlyMap<string, DeckEntry>
): BattlefieldSlot[] {
  const filled = [...battlefields.values()].slice(0, 3);
  const slots: BattlefieldSlot[] = [...filled];
  while (slots.length < 3) {
    slots.push(null);
  }
  return slots;
}

export function buildDeckGridRows(
  entries: DeckEntry[],
  options: { columns?: number; includeAdd?: boolean } = {}
): DeckGridCell[][] {
  const columns = options.columns ?? DECK_GRID_COLUMNS;
  const includeAdd = options.includeAdd ?? true;

  const cells: DeckGridCell[] = entries.map((entry) => ({
    kind: 'card',
    name: entry.card.name,
    entry,
  }));

  if (includeAdd) {
    cells.push({ kind: 'add' });
  }

  const rows: DeckGridCell[][] = [];
  for (let index = 0; index < cells.length; index += columns) {
    const row = cells.slice(index, index + columns);
    while (row.length < columns && index + columns >= cells.length && !includeAdd) {
      row.push({ kind: 'empty' });
    }
    rows.push(row);
  }

  if (rows.length === 0) {
    rows.push(includeAdd ? [{ kind: 'add' }] : [{ kind: 'empty' }]);
  }

  return rows;
}

export function totalRuneCount(runes: ReadonlyMap<string, DeckEntry>): number {
  let total = 0;
  for (const [, entry] of runes) {
    total += entry.count;
  }
  return total;
}
