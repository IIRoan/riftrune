/**
 * Public HTTPS origin for shareable The Astral Grove deck links.
 * Prefer an explicit web origin (from `window.location` on web); otherwise
 * EXPO_PUBLIC_APP_URL / EXPO_DEV_SERVER_ORIGIN; finally the production host.
 */
export function resolveAppOrigin(webOrigin?: string | null): string {
  const fromWeb = String(webOrigin ?? '')
    .trim()
    .replace(/\/$/, '');
  if (fromWeb.length > 0 && fromWeb !== 'null') {
    return fromWeb;
  }

  const fromEnv = String(
    process.env.EXPO_PUBLIC_APP_URL ?? process.env.EXPO_DEV_SERVER_ORIGIN ?? ''
  ).replace(/\/$/, '');
  if (fromEnv.length > 0) return fromEnv;

  return 'https://rift.solace.onl';
}

/** Path-only deck view href used inside the Expo Router app. */
export function deckSharePath(deckId: string): `/decks/${string}` {
  return `/decks/${encodeURIComponent(deckId)}`;
}

/**
 * Absolute shareable URL for a deck.
 * Pass `webOrigin` on web (`window.location.origin`) so the link matches the
 * current host (e.g. riftbounddev.roan.dev).
 */
export function buildDeckShareUrl(
  deckId: string,
  webOrigin?: string | null
): string {
  return `${resolveAppOrigin(webOrigin)}${deckSharePath(deckId)}`;
}
