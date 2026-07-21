import type { BrowserContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { API_URL_RUNTIME_OVERRIDE_KEY } from '../../lib/api-url';
import { API_URL, WEB_ORIGIN } from './env';

export type UiE2eUser = {
  email: string;
  password: string;
  name: string;
};

const SESSION_COOKIE = '__Secure-better-auth.session_token';

export function uniqueTestUser(prefix = 'ui-e2e'): UiE2eUser {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `${prefix}-${stamp}@test.riftbound.dev`,
    password: 'password123',
    name: `UI E2E ${stamp}`,
  };
}

/**
 * Point the Expo web app at the local API before any app modules evaluate.
 * Metro inlines apps/mobile/.env into expo/virtual/env; shell EXPO_PUBLIC_*
 * cannot override that. Playwright's Chromium runs this init script first.
 */
export async function installLocalApiOverride(context: BrowserContext): Promise<void> {
  await context.addInitScript(
    ({ key, apiUrl }) => {
      Object.defineProperty(globalThis, key, {
        value: apiUrl,
        configurable: true,
        enumerable: false,
        writable: true,
      });
    },
    { key: API_URL_RUNTIME_OVERRIDE_KEY, apiUrl: API_URL }
  );
}

/**
 * Sign up via Better Auth and inject the session cookie into Playwright Chromium.
 *
 * Playwright's APIRequestContext hangs parsing `__Secure-*` Set-Cookie from
 * http://localhost (API emits Secure cookies because BETTER_AUTH_URL is https).
 * Use fetch + addCookies instead.
 */
export async function signUpAndHydrateSession(
  context: BrowserContext,
  user: UiE2eUser = uniqueTestUser()
): Promise<UiE2eUser> {
  const res = await fetch(`${API_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      origin: WEB_ORIGIN,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      name: user.name,
    }),
  });
  expect(res.ok, `sign-up HTTP ${res.status}: ${await res.text()}`).toBeTruthy();

  const token = res.headers.get('set-auth-token');
  expect(token, 'missing set-auth-token from sign-up').toBeTruthy();

  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: token!,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
  ]);

  return user;
}

/** Land on search as an authenticated user (AuthGate cleared). */
export async function gotoSignedInSearch(page: Page): Promise<void> {
  await page.goto('/search');
  await expect(page.getByPlaceholder('Search cards, artists, tags, or set numbers')).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByRole('tab', { name: 'Sign up' })).toHaveCount(0);
}
