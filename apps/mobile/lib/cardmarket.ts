/** Cardmarket storefront base for Riftbound singles. */
export const CARDMARKET_RIFTBOUND_ORIGIN = 'https://www.cardmarket.com/en/Riftbound';

/** Cardmarket product deep-link via `?idProduct=` (works without slug/set path). */
export function buildCardmarketProductUrl(cardmarketId: number): string {
  if (!Number.isInteger(cardmarketId) || cardmarketId <= 0) {
    throw new Error(`Invalid Cardmarket product id: ${String(cardmarketId)}`);
  }
  return `${CARDMARKET_RIFTBOUND_ORIGIN}/Products?idProduct=${String(cardmarketId)}`;
}
