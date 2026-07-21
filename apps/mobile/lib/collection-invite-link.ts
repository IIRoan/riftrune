/**
 * Detects phones/tablets from a browser user-agent string.
 * Used by the HTTPS invite linking page to choose app deep-link vs web accept.
 */
export function isLikelyMobileUserAgent(userAgent: string): boolean {
  if (!userAgent.trim()) return false;
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );
}

/** Native scheme partners with Expo `scheme: riftrune`. */
export function buildCollectionInviteDeepLink(token: string): string {
  return `riftrune://collection/invite/${token}`;
}

/** In-app / Expo-web path for the accept UI (after linking page). */
export function collectionInviteAcceptPath(token: string): string {
  return `/collection/invite/${token}`;
}

/** Public linking path that is shared in HTTPS invite URLs. */
export function collectionInviteLinkingPath(token: string): string {
  return `/invite/${token}`;
}
