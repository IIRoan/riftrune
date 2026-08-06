import { describe, expect, mock, test } from 'bun:test';

const prefetch = mock(async () => true);
const getCachePathAsync = mock(async () => '/cache/img');

mock.module('expo-image', () => ({
  Image: { prefetch, getCachePathAsync },
}));

mock.module('@/utils/resolveImageUrl', () => ({
  resolveImageUrl: (url: string | null | undefined) => url ?? '',
}));

const markSessionImageLoaded = mock(() => undefined);
mock.module('@/lib/imageSessionCache', () => ({
  markSessionImageLoaded,
}));

const { prefetchImageUris } = await import('@/lib/imagePrefetch');

describe('prefetchImageUris', () => {
  test('batches unique uris into expo-image disk prefetch', async () => {
    prefetch.mockClear();
    markSessionImageLoaded.mockClear();

    await prefetchImageUris(
      ['https://a/1.webp', 'https://a/1.webp', 'https://a/2.webp', null],
      { limit: 10 }
    );

    expect(prefetch).toHaveBeenCalledWith(
      ['https://a/1.webp', 'https://a/2.webp'],
      { cachePolicy: 'memory-disk' }
    );
    expect(markSessionImageLoaded).toHaveBeenCalledTimes(2);
  });

  test('respects limit', async () => {
    prefetch.mockClear();
    await prefetchImageUris(
      ['https://a/1.webp', 'https://a/2.webp', 'https://a/3.webp'],
      { limit: 2 }
    );
    expect(prefetch.mock.calls[0]?.[0]).toHaveLength(2);
  });
});
