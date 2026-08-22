/** Hosted Astral Grove API (Railway). Used when EXPO_PUBLIC_API_URL is unset. */
export const DEFAULT_API_URL = 'https://riftapi.solace.onl';

/** Playwright UI e2e sets this before app modules load so cookies stay on localhost. */
export const API_URL_RUNTIME_OVERRIDE_KEY = '__ASTRAL_GROVE_API_URL__';

type GlobalWithApiOverride = typeof globalThis & {
  [API_URL_RUNTIME_OVERRIDE_KEY]?: string;
};

/** API base URL with trailing slashes stripped for path joins. */
export function getApiUrl(): string {
  const runtime = (globalThis as GlobalWithApiOverride)[API_URL_RUNTIME_OVERRIDE_KEY];
  if (typeof runtime === 'string' && runtime.length > 0) {
    return runtime.replace(/\/$/, '');
  }
  return String(process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');
}
