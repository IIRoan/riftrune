/** Canonical tab ids for bottom bar + side rail. */
export type AppTabId =
  | 'search'
  | 'collection'
  | 'wishlist'
  | 'decks'
  | 'play'
  | 'settings';

/**
 * Resolve the active primary tab from an Expo Router pathname.
 * Uses `includes` so both `/collection` and `/(tabs)/collection` match.
 */
export function tabIdFromPathname(pathname: string): AppTabId {
  if (pathname.includes('/collection')) return 'collection';
  if (pathname.includes('/wishlist')) return 'wishlist';
  if (pathname.includes('/decks')) return 'decks';
  if (pathname.includes('/play')) return 'play';
  if (pathname.includes('/settings')) return 'settings';
  return 'search';
}
