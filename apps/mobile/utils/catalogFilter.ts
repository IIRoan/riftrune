export const FILTER_GROUPS = [
  { label: 'Collection', options: ['Owned', 'Wishlist'] },
  {
    label: 'Domain',
    options: ['Fury', 'Calm', 'Mind', 'Body', 'Chaos', 'Order'],
  },
  {
    label: 'Type',
    options: ['Unit', 'Spell', 'Gear', 'Legend', 'Battlefield', 'Rune'],
  },
  {
    label: 'Rarity',
    options: ['Common', 'Uncommon', 'Rare', 'Epic', 'Showcase'],
  },
] as const;

export const ALL_CARDS_FILTER = 'All cards';

/** Client-side filter for card list items. */
export function matchesCatalogFilter(
  card: {
    colors: string[];
    type: string;
    rarity: string;
    variantNumber: string;
    printings?: { variantNumber: string }[];
  },
  filter: string,
  collectionByVariant: ReadonlyMap<string, { quantity: number }>
): boolean {
  if (filter === ALL_CARDS_FILTER) return true;

  const owned = (card.printings ?? [{ variantNumber: card.variantNumber }]).reduce(
    (sum, p) => sum + (collectionByVariant.get(p.variantNumber)?.quantity ?? 0),
    0
  );

  if (filter === 'Owned') return owned > 0;
  if (filter === 'Wishlist') return owned === 0;

  const domains = FILTER_GROUPS[1].options as readonly string[];
  if (domains.includes(filter as (typeof domains)[number])) {
    return card.colors.some((c) => c.includes(filter));
  }

  const types = FILTER_GROUPS[2].options as readonly string[];
  if (types.includes(filter as (typeof types)[number])) {
    return card.type === filter;
  }

  const rarities = FILTER_GROUPS[3].options as readonly string[];
  if (rarities.includes(filter as (typeof rarities)[number])) {
    return card.rarity === filter;
  }

  return true;
}
