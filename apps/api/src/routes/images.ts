import { Elysia } from 'elysia';
import type { ImageStoreService } from '../services/image-store.js';

const BODY_CACHE_CONTROL = 'public, max-age=604800, immutable';
const REDIRECT_CACHE_CONTROL = 'public, max-age=300';

export function createImagesRoutes(images: ImageStoreService) {
  return new Elysia({ prefix: '/api/v1/images' }).get(
    '/*',
    async ({ params, request, set }) => {
      const key = params['*'];
      if (!key) {
        set.status = 404;
        return { error: 'NOT_FOUND', message: 'Image not found' };
      }

      const result = await images.serveImage(key);
      if (!result) {
        set.status = 404;
        return { error: 'NOT_FOUND', message: 'Image not found' };
      }

      if (result.kind === 'redirect') {
        return new Response(null, {
          status: 302,
          headers: {
            location: result.url,
            'cache-control': REDIRECT_CACHE_CONTROL,
            'x-image-source': 'cdn-redirect',
          },
        });
      }

      const ifNoneMatch = request.headers.get('if-none-match');
      if (ifNoneMatch && ifNoneMatch === result.etag) {
        return new Response(null, {
          status: 304,
          headers: {
            etag: result.etag,
            'cache-control': BODY_CACHE_CONTROL,
            'x-image-source': result.source,
          },
        });
      }

      return new Response(result.body, {
        headers: {
          'content-type': result.contentType,
          'cache-control': BODY_CACHE_CONTROL,
          etag: result.etag,
          'x-image-source': result.source,
        },
      });
    },
    { detail: { tags: ['images'] } }
  );
}
