/** How Cardmarket EUR daily price guide fields map to our API. */
export const CARDMARKET_PRICE_GUIDE = {
  provider: 'cardmarket' as const,
  currency: 'EUR' as const,
  /** Cardmarket "Trend Price" — smoothed market estimate from the price guide. */
  headlineField: 'trend' as const,
  /**
   * Cardmarket "Low Price" — cheapest marketplace listing.
   * Not filtered by language or condition (can be Chinese, damaged, etc.).
   */
  listingLowField: 'low' as const,
} as const;

export function cardmarketFilterLabel(isFoil: boolean): string {
  return isFoil ? 'Foil' : 'Non-foil';
}

export function cardmarketPriceScopeLabel(isFoil: boolean): string {
  return `${cardmarketFilterLabel(isFoil)} · Cardmarket price guide · EUR`;
}

/** Short note for inline UI — trend is the headline; low is unfiltered. */
export const CARDMARKET_PRICE_SCOPE_NOTE =
  'Trend = Cardmarket price guide estimate. Cheapest listing = lowest offer on the marketplace (any language, any condition). Language and NM filters are not applied.';

/** Longer note for wishlist / detail footers. */
export const CARDMARKET_PRICE_DETAIL_NOTE =
  'Prices sync daily from Cardmarket\'s public price guide (EUR). We show trend for headlines and charts. The cheapest listing can be a foreign-language or heavily played copy — compare both before buying.';
