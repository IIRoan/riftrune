/**
 * Railway overwrites `X-Real-IP` with the connecting client address.
 * Better Auth will not use a comma-separated `X-Forwarded-For` chain unless
 * `trustedProxies` is set, so a single-value header is required in production.
 */
export const AUTH_IP_ADDRESS_HEADERS = ['x-real-ip'] as const;

export function resolveAuthAdvanced(
  cookieDomain: string | undefined,
  options?: { useSecureCookies?: boolean }
) {
  const secure = options?.useSecureCookies ?? Boolean(cookieDomain);

  return {
    ipAddress: {
      ipAddressHeaders: [...AUTH_IP_ADDRESS_HEADERS],
    },
    defaultCookieAttributes: {
      secure,
      httpOnly: true,
      sameSite: 'lax' as const,
    },
    ...(cookieDomain
      ? {
        crossSubDomainCookies: {
          enabled: true as const,
          domain: cookieDomain,
        },
      }
      : {}),
  };
}
