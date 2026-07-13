import type { CardDetail, CardListItem, CardsListQuery } from '@riftbound/contracts';
import {
  cardPrimaryNameToken,
  isTokenVariantNumber,
  legendChampionTags,
} from '@riftbound/contracts';
import {
  cardMatchesSectionType,
  deckCardFromDetail,
  deckCardFromListItem,
  getSectionCount,
  isChampionUnit,
  isLegendCard,
} from '@/lib/deck-card';
import { BATTLEFIELD_MAX, battlefieldsAtCapacity } from '@/lib/deck-limits';
import {
  getDeckIdentity,
  isCardEligibleForSection,
} from '@/lib/deck-eligibility';
import type { DeckCard, DeckSectionKey, DeckState } from '@/lib/deck-types';
import { api } from '@/src/api/client';
import { groupCardListItems, normalizeCardListItems } from '@/utils/variants';

export type DeckAddCatalogStatus =
  | 'loading'
  | 'ready'
  | 'error'
  | 'needs-legend'
  | 'no-catalog-results'
  | 'no-eligible-results';

export type DeckAddSectionMeta = {
  placeholder: string;
  contextLine: string | null;
  requiresLegend: boolean;
  limit: number;
  pageSize: number;
  infiniteScroll: boolean;
};

export const BATTLEFIELD_PAGE_SIZE = 80;
export const MAIN_DECK_PAGE_SIZE = 80;
export const BATCH_DETAILS_CHUNK_SIZE = 100;

export const MAIN_DECK_CATALOG_TYPES = 'Unit,Gear,Spell';

export function getDeckAddSectionMeta(
  section: DeckSectionKey,
  deck: DeckState
): DeckAddSectionMeta {
  switch (section) {
    case 'legend':
      return {
        placeholder: 'Search legends',
        contextLine: null,
        requiresLegend: false,
        limit: 60,
        pageSize: 60,
        infiniteScroll: false,
      };
    case 'champion':
      return {
        placeholder: 'Search champion units',
        contextLine: deck.legend
          ? `Champion units for ${deck.legend.name}${
              legendChampionTags(deck.legend).length
                ? ` · ${legendChampionTags(deck.legend).join(', ')}`
                : ''
            }`
          : 'Choose a Legend first',
        requiresLegend: true,
        limit: 80,
        pageSize: 80,
        infiniteScroll: false,
      };
    case 'runes':
      return {
        placeholder: 'Search runes',
        contextLine: deck.legend
          ? `Runes matching ${deck.legend.colors.join(' · ')}`
          : null,
        requiresLegend: false,
        limit: 40,
        pageSize: 40,
        infiniteScroll: false,
      };
    case 'battlefields': {
      const count = getSectionCount(deck, 'battlefields');
      const remaining = BATTLEFIELD_MAX - count;
      return {
        placeholder: 'Search battlefields',
        contextLine:
          remaining <= 0
            ? '3/3 slots filled — remove a battlefield on your deck to swap'
            : `${count}/3 in deck · ${remaining} slot${remaining === 1 ? '' : 's'} open`,
        requiresLegend: false,
        limit: BATTLEFIELD_PAGE_SIZE,
        pageSize: BATTLEFIELD_PAGE_SIZE,
        infiniteScroll: true,
      };
    }
    case 'sideboard':
      return {
        placeholder: 'Search sideboard cards',
        contextLine: deck.legend
          ? `Sideboard · ${deck.legend.colors.join(' · ')} identity`
          : null,
        requiresLegend: false,
        limit: MAIN_DECK_PAGE_SIZE,
        pageSize: MAIN_DECK_PAGE_SIZE,
        infiniteScroll: true,
      };
    default:
      return {
        placeholder: 'Search main deck cards',
        contextLine: deck.legend
          ? `Main deck · ${deck.legend.colors.join(' · ')} identity`
          : null,
        requiresLegend: false,
        limit: MAIN_DECK_PAGE_SIZE,
        pageSize: MAIN_DECK_PAGE_SIZE,
        infiniteScroll: true,
      };
  }
}

export function defaultDeckAddSearch(section: DeckSectionKey, deck: DeckState): string {
  if (section !== 'champion' || !deck.legend) return '';
  return cardPrimaryNameToken(deck.legend);
}

export function effectiveDeckAddSearch(
  section: DeckSectionKey,
  deck: DeckState,
  userQuery: string
): string {
  const trimmed = userQuery.trim();
  if (trimmed) return trimmed;
  return defaultDeckAddSearch(section, deck);
}

export function deckCatalogColorsParam(deck: DeckState): string | undefined {
  const identity = getDeckIdentity(deck);
  if (!identity.allowedDomains || identity.allowedDomains.size === 0) return undefined;
  return [...identity.allowedDomains].sort().join(',');
}

export function buildDeckAddListQuery(
  section: DeckSectionKey,
  deck: DeckState,
  userQuery: string,
  page = 1
): Partial<CardsListQuery> {
  const q = effectiveDeckAddSearch(section, deck, userQuery);
  const meta = getDeckAddSectionMeta(section, deck);
  const identityColors = deckCatalogColorsParam(deck);
  const base = {
    page,
    sortBy: 'name' as const,
    dir: 'asc' as const,
    limit: meta.pageSize,
  };

  switch (section) {
    case 'legend':
      return { ...base, types: 'Legend', ...(q ? { q } : {}) };
    case 'champion':
      return { ...base, types: 'Unit', super: 'Champion', ...(q ? { q } : {}) };
    case 'runes':
      return {
        ...base,
        types: 'Rune',
        ...(identityColors ? { colors: identityColors } : {}),
        ...(q ? { q } : {}),
      };
    case 'battlefields':
      return { ...base, types: 'Battlefield', ...(q ? { q } : {}) };
    case 'mainDeck':
      return {
        ...base,
        types: MAIN_DECK_CATALOG_TYPES,
        excludeTokens: true,
        ...(identityColors ? { colors: identityColors } : {}),
        ...(q ? { q } : {}),
      };
    case 'sideboard':
      return {
        ...base,
        types: MAIN_DECK_CATALOG_TYPES,
        excludeTokens: true,
        ...(identityColors ? { colors: identityColors } : {}),
        ...(q ? { q } : {}),
      };
    default:
      return base;
  }
}

export function deckAddListQueryKey(
  section: DeckSectionKey,
  query: Partial<CardsListQuery>,
  deck?: Pick<DeckState, 'legend'>
): string {
  return [
    section,
    deck?.legend?.variantNumber ?? '',
    query.q ?? '',
    String(query.limit ?? ''),
    query.types ?? '',
    query.super ?? '',
    query.colors ?? '',
  ].join('|');
}

export const DECK_ADD_CATALOG_STALE_MS = 30 * 60 * 1000;

export function deckAddInfiniteQueryKey(
  section: DeckSectionKey,
  deck: DeckState,
  userQuery: string
): readonly ['deck-add-list', string] {
  const listQueryBase = buildDeckAddListQuery(section, deck, userQuery);
  return ['deck-add-list', deckAddListQueryKey(section, listQueryBase, deck)] as const;
}

export async function fetchDeckAddListPage(
  section: DeckSectionKey,
  deck: DeckState,
  userQuery: string,
  page: number
) {
  return api.listCards(buildDeckAddListQuery(section, deck, userQuery, page));
}

export function legendNeedsHydration(legend: DeckCard | null | undefined): boolean {
  if (!legend) return false;
  return legend.tags.length === 0;
}

export function mergeHydratedLegend(deck: DeckState, detail: CardDetail): DeckState {
  if (!deck.legend) return deck;
  return {
    ...deck,
    legend: deckCardFromDetail(detail, deck.legend.variantNumber),
  };
}

export function pickPrimaryListItems(items: CardListItem[]): CardListItem[] {
  return groupCardListItems(normalizeCardListItems(items));
}

/** One catalog row per logical card (first search hit per cardId). */
export function uniqueCardListItems(items: CardListItem[]): CardListItem[] {
  const normalized = normalizeCardListItems(items);
  const byCardId = new Map<string, CardListItem>();
  for (const item of normalized) {
    if (!byCardId.has(item.cardId)) {
      byCardId.set(item.cardId, item);
    }
  }
  return [...byCardId.values()];
}

export function primaryVariantNumbers(items: CardListItem[]): string[] {
  return uniqueCardListItems(items).map((item) => item.variantNumber);
}

function detailMapFromBatch(details: CardDetail[]): Map<string, CardDetail> {
  const map = new Map<string, CardDetail>();
  for (const detail of details) {
    map.set(detail.id, detail);
    for (const variant of detail.variants) {
      map.set(variant.variantNumber, detail);
    }
  }
  return map;
}

export function matchesDeckAddSectionType(
  card: DeckCard,
  section: DeckSectionKey
): boolean {
  if (section === 'champion') return isChampionUnit(card);
  if (section === 'legend') return isLegendCard(card);
  return cardMatchesSectionType(card, section);
}

function cardFromListItemForSection(item: CardListItem, section: DeckSectionKey): DeckCard {
  const card = deckCardFromListItem(item);
  if (section === 'champion') {
    return { ...card, super: 'Champion' };
  }
  return card;
}

function matchesSectionFromListItem(item: CardListItem, section: DeckSectionKey): boolean {
  const type = item.type.toLowerCase();
  switch (section) {
    case 'legend':
      return type === 'legend';
    case 'champion':
      return type === 'unit';
    case 'runes':
      return type === 'rune';
    case 'battlefields':
      return type === 'battlefield';
    case 'mainDeck':
    case 'sideboard':
      return type === 'unit' || type === 'gear' || type === 'spell';
    default:
      return false;
  }
}

export function buildDeckAddCandidates(args: {
  section: DeckSectionKey;
  listItems: CardListItem[];
  details: CardDetail[];
}): DeckCard[] {
  const { section, listItems, details } = args;
  if (!listItems.length) return [];

  const detailByKey = detailMapFromBatch(details);
  const primaryItems = uniqueCardListItems(listItems);
  const candidates: DeckCard[] = [];
  const seenCardIds = new Set<string>();

  for (const item of primaryItems) {
    if (!matchesSectionFromListItem(item, section)) continue;
    if (isTokenVariantNumber(item.variantNumber)) continue;

    const detail = detailByKey.get(item.variantNumber) ?? detailByKey.get(item.cardId);
    const card = detail
      ? deckCardFromDetail(detail, item.variantNumber)
      : cardFromListItemForSection(item, section);

    if (!matchesDeckAddSectionType(card, section)) continue;
    if (
      (section === 'mainDeck' || section === 'sideboard') &&
      isChampionUnit(card)
    ) {
      continue;
    }
    if (section === 'sideboard' && card.isSignature) continue;
    if (seenCardIds.has(card.cardId)) continue;

    seenCardIds.add(card.cardId);
    candidates.push(card);
  }

  return candidates;
}

/** Add picker display rules per section (type filtering happens in the API query). */
export function filterDeckAddDisplayCards(
  _deck: DeckState,
  _section: DeckSectionKey,
  candidates: DeckCard[]
): DeckCard[] {
  return candidates;
}

export function sectionUsesEligibilityFilter(_section: DeckSectionKey): boolean {
  return false;
}

export function sectionNeedsCardDetails(_section: DeckSectionKey): boolean {
  return false;
}

export function describeDeckAddEmptyState(args: {
  section: DeckSectionKey;
  deck: DeckState;
  status: DeckAddCatalogStatus;
  catalogTotal: number;
  candidateCount: number;
  userQuery: string;
}): { title: string; description: string } {
  const { section, deck, status, catalogTotal, candidateCount, userQuery } = args;
  const meta = getDeckAddSectionMeta(section, deck);
  const search = effectiveDeckAddSearch(section, deck, userQuery);

  if (status === 'needs-legend') {
    return {
      title: 'Legend required',
      description: 'Pick a Legend on your deck before choosing a champion unit.',
    };
  }

  if (status === 'error') {
    return {
      title: 'Could not load cards',
      description: 'Check your connection and try again.',
    };
  }

  if (status === 'no-catalog-results') {
    if (section === 'champion') {
      return {
        title: 'No champion units found',
        description: search
          ? `No champion units match "${search}". Try another spelling or shorter name.`
          : 'Search for a champion unit by name.',
      };
    }
    if (section === 'battlefields') {
      return {
        title: 'No battlefields found',
        description: search
          ? `No battlefields match "${search}".`
          : 'Search for a battlefield by name.',
      };
    }
    return {
      title: 'No cards found',
      description: search
        ? `No cards match "${search}".`
        : meta.placeholder,
    };
  }

  if (status === 'no-eligible-results') {
    const identity = getDeckIdentity(deck);
    const domains = identity.allowedDomains
      ? [...identity.allowedDomains].join(' · ')
      : null;

    if (section === 'champion' && deck.legend) {
      const primary = cardPrimaryNameToken(deck.legend);
      return {
        title: 'No eligible champions',
        description: primary
          ? `Found ${candidateCount} champion unit(s) for "${search}", but none are ${primary} champions for ${deck.legend.name}.`
          : `Found champion units for "${search}", but none match ${deck.legend.name}.`,
      };
    }

    if (section === 'battlefields') {
      if (battlefieldsAtCapacity(deck)) {
        return {
          title: 'All battlefield slots filled',
          description: 'Remove a battlefield from your deck to swap in another.',
        };
      }
      return {
        title: 'No eligible battlefields',
        description: catalogTotal
          ? `Found ${catalogTotal} battlefield(s)${search ? ` for "${search}"` : ''}, but none can be added right now.`
          : 'No battlefields available to add.',
      };
    }

    if ((section === 'mainDeck' || section === 'sideboard') && domains) {
      const label = section === 'sideboard' ? 'sideboard' : 'main deck';
      return {
        title: search ? 'No matching cards' : 'No cards found',
        description: search
          ? `No ${label} cards match "${search}".`
          : `No ${label} cards found for ${domains} identity. Try searching by name.`,
      };
    }

    if (domains) {
      return {
        title: 'No eligible cards',
        description: `Cards must match your legend identity (${domains}).`,
      };
    }

    return {
      title: 'No eligible cards',
      description: 'Adjust your search or switch sections.',
    };
  }

  return {
    title: 'No eligible cards',
    description: meta.placeholder,
  };
}

export function filterEligibleDeckAddCards(
  deck: DeckState,
  section: DeckSectionKey,
  candidates: DeckCard[]
): DeckCard[] {
  return candidates.filter((candidate) =>
    isCardEligibleForSection({ deck, section, candidateCard: candidate }).eligible
  );
}
