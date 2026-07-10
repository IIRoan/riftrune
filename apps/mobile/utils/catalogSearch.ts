import type { CardListItem } from '@riftbound/contracts';
import type { CatalogSort } from '@/constants/catalogSort';
import { getCardPrintings } from '@/utils/variants';

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
    case 'releaseDate':
      return a.name.localeCompare(b.name) * dir;
    default:
      return a.name.localeCompare(b.name) * dir;
  }
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

  const sorted = matches
    .slice()
    .sort((a, b) => {
      const relevance = relevanceScore(a, trimmed) - relevanceScore(b, trimmed);
      if (relevance !== 0) return relevance;
      return compareBySort(a, b, sort);
    });

  return limit === undefined ? sorted : sorted.slice(0, limit);
}

function priceScore(card: CardListItem): number {
  const printings = getCardPrintings(card);
  const printingPrices = printings.map(
    (printing) => printing.priceEur?.market ?? printing.priceEur?.low ?? 0
  );
  const primary = card.priceEur?.market ?? card.priceEur?.low ?? 0;
  return Math.max(primary, ...printingPrices, 0);
}

export function featuredCatalogItems(
  items: readonly CardListItem[],
  limit = 12
): CardListItem[] {
  return [...items].sort((a, b) => priceScore(b) - priceScore(a)).slice(0, limit);
}
