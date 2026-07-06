import type { PaLogicalCard } from '@riftbound/contracts';
import type { S3Client } from 'bun';
import type { Env } from '../env.js';
import { TtlCache } from '../lib/ttl-cache.js';
import {
  cdnImageUrl,
  contentTypeForKey,
  createS3Client,
  hasS3Config,
  isSafeImageKey,
  rewriteCardImageUrls,
  rewriteImageUrl,
} from '../lib/s3.js';

type CachedImage = {
  body: ArrayBuffer;
  contentType: string;
  etag: string;
};

export type ServeImageResult =
  | {
      kind: 'body';
      body: ArrayBuffer;
      contentType: string;
      source: 's3' | 'memory';
      etag: string;
    }
  | { kind: 'redirect'; url: string };

const MEMORY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const S3_MISS_CACHE_TTL_MS = 60 * 1000;

function imageEtag(key: string, byteLength: number): string {
  return `"${key}:${String(byteLength)}"`;
}

export class ImageStoreService {
  private readonly client: S3Client | null;
  private readonly memoryCache = new TtlCache<CachedImage>(MEMORY_CACHE_TTL_MS, 2000);
  private readonly s3MissCache = new TtlCache<true>(S3_MISS_CACHE_TTL_MS, 5000);
  private readonly serveInflight = new Map<string, Promise<ServeImageResult | null>>();
  private readonly backgroundInflight = new Set<string>();

  constructor(private readonly env: Env) {
    if (hasS3Config(env)) {
      this.client = createS3Client(env);
      console.log(
        `[s3] Image cache enabled (bucket=${env.S3_BUCKET}, lazy background fill)`
      );
    } else {
      this.client = null;
      console.log('[s3] Image cache disabled (S3 env vars not fully configured)');
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  rewriteImageUrl(url: string): string {
    return rewriteImageUrl(this.env, url);
  }

  rewriteCard(card: PaLogicalCard): PaLogicalCard {
    return rewriteCardImageUrls(this.env, card);
  }

  async serveImage(key: string): Promise<ServeImageResult | null> {
    const normalizedKey = key.replace(/^\//, '');
    if (!isSafeImageKey(normalizedKey)) return null;

    const cached = this.memoryCache.get(normalizedKey);
    if (cached) {
      return {
        kind: 'body',
        body: cached.body,
        contentType: cached.contentType,
        source: 'memory',
        etag: cached.etag,
      };
    }

    const inflight = this.serveInflight.get(normalizedKey);
    if (inflight) return inflight;

    const promise = this.resolveImage(normalizedKey);
    this.serveInflight.set(normalizedKey, promise);
    try {
      return await promise;
    } finally {
      this.serveInflight.delete(normalizedKey);
    }
  }

  private async resolveImage(key: string): Promise<ServeImageResult | null> {
    if (this.client && !this.s3MissCache.has(key)) {
      try {
        const file = this.client.file(key);
        const body = await file.arrayBuffer();
        if (body.byteLength > 0) {
          const stat = await this.client.stat(key);
          const contentType =
            typeof stat.type === 'string' && stat.type.length > 0
              ? stat.type
              : contentTypeForKey(key);
          const etag = imageEtag(key, body.byteLength);
          this.memoryCache.set(key, { body, contentType, etag });
          return { kind: 'body', body, contentType, source: 's3', etag };
        }
      } catch {
        this.s3MissCache.set(key, true);
      }
    }

    const cdnUrl = cdnImageUrl(key);
    if (this.client) {
      this.scheduleBackgroundStore(key, cdnUrl);
    }

    return { kind: 'redirect', url: cdnUrl };
  }

  private scheduleBackgroundStore(key: string, cdnUrl: string): void {
    if (this.backgroundInflight.has(key)) return;

    this.backgroundInflight.add(key);
    void this.storeFromCdn(key, cdnUrl)
      .catch((err) => {
        console.warn(`[s3] Background save failed for ${key}:`, err);
      })
      .finally(() => {
        this.backgroundInflight.delete(key);
      });
  }

  private async storeFromCdn(key: string, cdnUrl: string): Promise<void> {
    if (!this.client) return;

    try {
      const file = this.client.file(key);
      const existing = await file.arrayBuffer();
      if (existing.byteLength > 0) {
        this.s3MissCache.delete(key);
        return;
      }
    } catch {
      // not in bucket yet
    }

    console.log(`[s3] Background download: ${cdnUrl}`);
    const res = await fetch(cdnUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      throw new Error(`CDN download failed with status ${String(res.status)}`);
    }

    const body = await res.arrayBuffer();
    const contentType =
      res.headers.get('content-type')?.split(';')[0]?.trim() ??
      contentTypeForKey(key);

    await this.client.write(key, body, {
      type: contentType,
    });

    const etag = imageEtag(key, body.byteLength);
    this.memoryCache.set(key, { body, contentType, etag });
    this.s3MissCache.delete(key);

    console.log(
      `[s3] Background saved s3://${this.env.S3_BUCKET}/${key} (${String(body.byteLength)} bytes)`
    );
  }
}
