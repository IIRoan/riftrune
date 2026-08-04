import { deckCardFromDetail, deckCardFromListItem, isLegendCard } from '@/lib/deck-card';
import type { DeckCard } from '@/lib/deck-types';
import { groupCardListItems, normalizeCardListItems } from '@/utils/variants';
import type { CardDetail, CardListItem } from '@riftbound/contracts';

export const PLAY_LEGEND_PAGE_SIZE = 60;
/** Keep legend pages warm so reopening the picker feels instant. */
export const PLAY_LEGEND_STALE_MS = 30 * 60 * 1000;
/** Short debounce — search stays responsive without hammering the API. */
export const PLAY_LEGEND_SEARCH_DEBOUNCE_MS = 120;
/** Wait for typing to settle before batch-hydrating art (list art paints first). */
export const PLAY_LEGEND_DETAIL_DEFER_MS = 180;

export const PLAY_LEGEND_CATALOG_ROOT = 'play-legend-catalog' as const;
export const PLAY_LEGEND_DETAILS_ROOT = 'play-legend-details' as const;

/** Stable React Query key for a legend list page set. */
export function playLegendListQueryKey(
  search: string,
  pageSize = PLAY_LEGEND_PAGE_SIZE
): readonly unknown[] {
  const q = search.trim().toLowerCase();
  return [
    PLAY_LEGEND_CATALOG_ROOT,
    'cards',
    'search',
    q || 'type:legend',
    pageSize,
    'name',
    'asc',
  ] as const;
}

export function playLegendDetailsQueryKey(variantNumbers: readonly string[]): readonly unknown[] {
  return [PLAY_LEGEND_DETAILS_ROOT, [...variantNumbers].sort().join(',')] as const;
}

/** Group raw legend search pages the same way catalog browse does. */
export function groupLegendListItems(raw: CardListItem[]): CardListItem[] {
  return groupCardListItems(normalizeCardListItems(raw)).filter(
    (item) => item.type.toLowerCase() === 'legend'
  );
}

/**
 * Hydrate legend rows for the play picker.
 * Uses batch detail art when available; otherwise paints instantly from list payloads.
 */
export function buildPlayLegendRows(
  listItems: CardListItem[],
  details: readonly CardDetail[] | undefined
): DeckCard[] {
  const detailByVariant = new Map<string, CardDetail>();
  for (const card of details ?? []) {
    for (const variant of card.variants) {
      detailByVariant.set(variant.variantNumber, card);
    }
  }

  const results: DeckCard[] = [];
  for (const item of listItems) {
    const detail = detailByVariant.get(item.variantNumber);
    const card = detail
      ? deckCardFromDetail(detail, item.variantNumber)
      : deckCardFromListItem(item);
    if (!isLegendCard(card)) continue;
    results.push(card);
  }
  return results;
}

/**
 * Only block the picker on a spinner when we have nothing to show yet.
 * Cached / placeholder rows keep the list painted while a new search fetches.
 */
export function shouldShowLegendCatalogLoading(
  isInitialLoading: boolean,
  legendCount: number
): boolean {
  return isInitialLoading && legendCount === 0;
}

/**
 * Keep the last non-empty result set while a search is in flight so typing
 * never blanks the list. Clear immediately when a settled fetch returns empty.
 */
export function resolveDisplayedLegends<T>(
  legends: readonly T[],
  previous: readonly T[],
  isFetching: boolean
): readonly T[] {
  if (legends.length > 0) return legends;
  if (isFetching && previous.length > 0) return previous;
  return legends;
}

export type PlayScoreHintTone = {
  plateClassName: string;
  iconClassName: string;
  /** Explicit Phosphor color — Uniwind className alone can lose to defaults. */
  iconColor: string;
};

/**
 * Contrast plate for seat ± hints so icons stay readable on any seat art.
 * Light UI → dark plate + white glyph; dark UI → light plate + dark glyph.
 */
export function playScoreHintClasses(scheme: 'light' | 'dark'): PlayScoreHintTone {
  if (scheme === 'light') {
    return {
      plateClassName: 'border border-white/25 bg-black/75',
      iconClassName: 'text-white',
      iconColor: '#FFFFFF',
    };
  }
  return {
    plateClassName: 'border border-black/20 bg-white/92',
    iconClassName: 'text-neutral-950',
    iconColor: '#0A0A0A',
  };
}
