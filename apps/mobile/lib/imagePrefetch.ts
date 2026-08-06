import { Image } from 'expo-image';
import { markSessionImageLoaded } from '@/lib/imageSessionCache';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

const DEFAULT_BATCH = 48;

function normalizePrefetchUri(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const resolved = resolveImageUrl(raw);
  if (resolved) return resolved;
  if (raw.startsWith('http') || raw.startsWith('file:') || raw.startsWith('asset:')) {
    return raw;
  }
  return null;
}

/**
 * Warm the expo-image disk+memory cache for remote (or resolved) URIs.
 * Uses the Expo Image API — no extra package required beyond expo-image.
 */
export async function prefetchImageUris(
  uris: Array<string | null | undefined>,
  options?: { limit?: number }
): Promise<void> {
  const limit = options?.limit ?? DEFAULT_BATCH;
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const raw of uris) {
    const uri = normalizePrefetchUri(raw);
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    unique.push(uri);
    if (unique.length >= limit) break;
  }

  if (unique.length === 0) return;

  try {
    const ok = await Image.prefetch(unique, { cachePolicy: 'memory-disk' });
    if (ok) {
      for (const uri of unique) markSessionImageLoaded(uri);
      return;
    }
    await Promise.allSettled(
      unique.map(async (uri) => {
        const path = await Image.getCachePathAsync(uri).catch(() => null);
        if (path) markSessionImageLoaded(uri);
      })
    );
  } catch {
    // Prefetch is best-effort; screens still load images on demand.
  }
}
