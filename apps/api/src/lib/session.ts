import type { Auth } from '../auth.js';

type AuthUser = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>['user'];

export async function getSessionUser(
  auth: Auth,
  headers: Headers
): Promise<AuthUser | null> {
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
}

export function unauthorized() {
  return { error: 'UNAUTHORIZED' as const, message: 'Sign in required' };
}
