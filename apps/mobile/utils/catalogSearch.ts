import type { CardListItem } from '@riftbound/contracts';
import type { CatalogSort } from '@/constants/catalogSort';
import { getCardMaxMarketPrice, getCardPrintings } from '@/utils/variants';

export function tokenizeSearchQuery(raw: string): string[] {
  return raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function buildSearchBlob(card: CardListItem): string {
  const parts = [
    card.name,
    card.variantNumber,
    card.type,
    card.setCode,
    card.rarity,
    ...card.colors,
    ...getCardPrintings(card).map((printing) => printing.variantNumber),
    ...getCardPrintings(card).map((printing) => printing.variantLabel),
  ];
  return parts.join(' ').toLowerCase();
}

function relevanceScore(card: CardListItem, query: string): number {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return 0;

  const name = card.name.toLowerCase();
  const variantNumber = card.variantNumber.toLowerCase();

  if (name.startsWith(trimmed)) return 0;
  if (variantNumber.startsWith(trimmed)) return 1;
  if (name.includes(trimmed)) return 2;
  if (variantNumber.includes(trimmed)) return 3;
  return 4;
}

function matchesAllTokens(card: CardListItem, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const blob = buildSearchBlob(card);
  return tokens.every((token) => blob.includes(token));
}

function compareBySort(a: CardListItem, b: CardListItem, sort: CatalogSort): number {
  const dir = sort.dir === 'desc' ? -1 : 1;
  switch (sort.sortBy) {
    case 'energy':
      return (a.energy - b.energy) * dir || a.name.localeCompare(b.name);
    case 'variantNumber':
      return a.variantNumber.localeCompare(b.variantNumber) * dir || a.name.localeCompare(b.name);
    case 'price': {
      const diff = (getCardMaxMarketPrice(a) - getCardMaxMarketPrice(b)) * dir;
      return diff || a.name.localeCompare(b.name);
    }
    case 'releaseDate':
      // Not supported in the UI — keep a stable name fallback if an old client asks.
      return a.name.localeCompare(b.name) * dir;
    default:
      return a.name.localeCompare(b.name) * dir;
  }
}

/** Sort the full catalog (or any card list) by the active browse/search sort. */
export function sortCatalogItems(
  items: readonly CardListItem[],
  sort: CatalogSort,
  limit?: number
): CardListItem[] {
  const sorted = [...items].sort((left, right) => compareBySort(left, right, sort));
  return limit === undefined ? sorted : sorted.slice(0, limit);
}

export function searchCatalogItems(
  items: readonly CardListItem[],
  query: string,
  sort: CatalogSort,
  limit?: number
): CardListItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tokens = tokenizeSearchQuery(trimmed);
  const matches = items.filter((card) => matchesAllTokens(card, tokens));

  const sorted = matches.slice().sort((a, b) => {
    if (sort.sortBy === 'price') {
      return compareBySort(a, b, sort);
    }
    const relevance = relevanceScore(a, trimmed) - relevanceScore(b, trimmed);
    if (relevance !== 0) return relevance;
    return compareBySort(a, b, sort);
  });

  return limit === undefined ? sorted : sorted.slice(0, limit);
}

export function featuredCatalogItems(
  items: readonly CardListItem[],
  limit = 12
): CardListItem[] {
  return sortCatalogItems(items, { sortBy: 'price', dir: 'desc' }, limit);
}
