export type RateLimitDecision =
  { allowed: true } | { allowed: false; retryAfterSec: number };

type Bucket = { count: number; resetAt: number };

export function createSlidingWindowLimiter(options: {
  windowMs: number;
  max: number;
  now?: () => number;
}) {
  const buckets = new Map<string, Bucket>();
  const now = options.now ?? Date.now;

  return {
    check(key: string): RateLimitDecision {
      const ts = now();
      const existing = buckets.get(key);
      if (!existing || existing.resetAt <= ts) {
        buckets.set(key, { count: 1, resetAt: ts + options.windowMs });
        return { allowed: true };
      }
      if (existing.count >= options.max) {
        return {
          allowed: false,
          retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - ts) / 1000)),
        };
      }
      existing.count += 1;
      return { allowed: true };
    },
    reset(): void {
      buckets.clear();
    },
  };
}

export function clientIpFromHeaders(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return 'unknown';
}
