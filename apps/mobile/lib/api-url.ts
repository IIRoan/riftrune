/** Hosted Riftrune API (Railway). Used when EXPO_PUBLIC_API_URL is unset. */
export const DEFAULT_API_URL = 'https://riftapi.solace.onl';

/**
 * Resolve the API base URL for catalog, auth, and image proxy requests.
 * Trailing slashes are stripped so path joins stay correct.
 */
export function getApiUrl(): string {
  return String(process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');
}
