import { getApiUrl } from '@/lib/api-url';

const API_URL = getApiUrl();
const LOCAL_API_DEFAULT = 'http://localhost:7000';
const API_IMAGES_PREFIX = '/api/v1/images/';
const CDN_HOST = 'cdn.piltoverarchive.com';

function isSafeImageKey(key: string): boolean {
  if (!key || key.includes('..')) return false;
  return key.startsWith('cards/') || key.startsWith('colors/');
}

function keyFromApiPath(pathname: string): string | null {
  if (!pathname.startsWith(API_IMAGES_PREFIX)) return null;
  const key = pathname.slice(API_IMAGES_PREFIX.length);
  return isSafeImageKey(key) ? key : null;
}

function keyFromCdnPath(pathname: string): string | null {
  const key = pathname.replace(/^\//, '');
  return isSafeImageKey(key) ? key : null;
}

function apiImageUrl(key: string): string {
  return `${API_URL}${API_IMAGES_PREFIX}${key}`;
}

/**
 * Normalize card image URLs for mobile clients.
 * Rewrites API proxy and CDN paths to EXPO_PUBLIC_API_URL so images always load
 * from the API the app is configured to use (which serves bytes directly).
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';

  if (url.startsWith(API_IMAGES_PREFIX)) {
    const key = keyFromApiPath(url);
    return key ? apiImageUrl(key) : `${API_URL}${url}`;
  }

  try {
    const parsed = new URL(url);
    const apiKey = keyFromApiPath(parsed.pathname);
    if (apiKey) {
      if (API_URL === LOCAL_API_DEFAULT && parsed.hostname !== 'localhost') {
        return url;
      }
      return apiImageUrl(apiKey);
    }

    if (parsed.hostname === CDN_HOST) {
      const cdnKey = keyFromCdnPath(parsed.pathname);
      if (cdnKey) return apiImageUrl(cdnKey);
    }
  } catch {
    // Fall through for non-URL strings.
  }

  return url;
}
