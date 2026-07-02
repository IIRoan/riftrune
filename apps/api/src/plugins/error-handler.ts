import { Elysia } from 'elysia';

export const errorPlugin = new Elysia({ name: 'error-handler' }).onError(
  ({ error, set }) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized'
        ? 401
        : message.includes('not found') || message.includes('Not Found')
          ? 404
          : 500;

    set.status = status;
    return {
      error: status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
      message,
    };
  }
);
