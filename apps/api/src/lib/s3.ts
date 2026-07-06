import { S3Client } from 'bun';
import type { PaLogicalCard } from '@riftbound/contracts';
import type { Env } from '../env.js';

export const CDN_BASE_URL = 'https://cdn.piltoverarchive.com';

export function hasS3Config(env: Env): boolean {
  return Boolean(
    env.S3_ACCESS_KEY_ID &&
      env.S3_SECRET_ACCESS_KEY &&
      env.S3_BUCKET &&
      env.S3_ENDPOINT
  );
}

export function createS3Client(env: Env): S3Client {
  const options: {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    endpoint: string;
    region?: string;
  } = {
    accessKeyId: env.S3_ACCESS_KEY_ID!,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    bucket: env.S3_BUCKET!,
    endpoint: env.S3_ENDPOINT!,
    region: env.S3_REGION ?? 'auto',
  };
  return new S3Client(options);
}

/** API-proxied image URL served from our backend cache. */
export function apiImageUrl(env: Env, key: string): string {
  const base = env.BETTER_AUTH_URL.replace(/\/$/, '');
  const normalizedKey = key.replace(/^\//, '');
  return `${base}/api/v1/images/${normalizedKey}`;
}

export function cdnImageUrl(key: string): string {
  return `${CDN_BASE_URL}/${key.replace(/^\//, '')}`;
}

export function isSafeImageKey(key: string): boolean {
  const normalized = key.replace(/^\//, '');
  if (!normalized || normalized.includes('..')) return false;
  return normalized.startsWith('cards/') || normalized.startsWith('colors/');
}

/** Extract the S3 object key from a CDN or upstream image URL. */
export function objectKeyFromUrl(url: string): string {
  const { pathname } = new URL(url);
  return pathname.replace(/^\//, '');
}

export function contentTypeForKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'webp':
      return 'image/webp';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

/** Rewrite a CDN URL to our API image route (sync, no network). */
export function rewriteImageUrl(env: Env, url: string): string {
  if (!hasS3Config(env) || !url) return url;

  const apiBase = `${env.BETTER_AUTH_URL.replace(/\/$/, '')}/api/v1/images/`;
  if (url.startsWith(apiBase)) return url;

  try {
    const key = objectKeyFromUrl(url);
    if (isSafeImageKey(key)) return apiImageUrl(env, key);
  } catch {
    // keep original URL for non-parseable values
  }

  return url;
}

export function rewriteCardImageUrls(env: Env, card: PaLogicalCard): PaLogicalCard {
  if (!hasS3Config(env)) return card;

  return {
    ...card,
    colors: card.colors.map((color) => ({
      ...color,
      imageUrl: color.imageUrl ? rewriteImageUrl(env, color.imageUrl) : color.imageUrl,
    })),
    variants: card.variants.map((variant) => ({
      ...variant,
      imageUrl: rewriteImageUrl(env, variant.imageUrl),
    })),
  };
}
