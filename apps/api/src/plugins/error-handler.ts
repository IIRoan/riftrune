import { Elysia } from 'elysia';
import { logActionFailure } from '../lib/logger.js';

export function createErrorPlugin() {
  return new Elysia({ name: 'error-handler' }).error(
    ({ error, set, request }) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const status =
        message === 'Unauthorized'
          ? 401
          : message.includes('not found') || message.includes('Not Found')
            ? 404
            : 500;

      if (status >= 500) {
        logActionFailure('api.unhandled', error, {
          method: request.method,
          path: new URL(request.url).pathname,
          status,
        });
      }

      set.status = status;
      return {
        error: status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
        message,
      };
    }
  );
}

export const errorPlugin = createErrorPlugin();
