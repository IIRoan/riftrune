import { getCookie as formatStoredAuthCookie } from '@better-auth/expo/client';
import { Platform } from 'react-native';
import { authClient } from '@/src/lib/auth-client';
import { secureStorage } from '@/src/lib/secure-storage';

const AUTH_COOKIE_STORAGE_KEY = 'riftrune_cookie';

/**
 * Cookie header for authenticated API requests on native.
 * Web clients should rely on `credentials: 'include'` instead.
 */
export function getAuthCookieHeader(): string {
  if (Platform.OS === 'web') return '';

  const clientGetCookie = (authClient as { getCookie?: () => string }).getCookie;
  if (typeof clientGetCookie === 'function') {
    const cookie = clientGetCookie.call(authClient);
    if (cookie) return cookie;
  }

  const stored = secureStorage.getItem(AUTH_COOKIE_STORAGE_KEY);
  return stored ? formatStoredAuthCookie(stored) : '';
}
