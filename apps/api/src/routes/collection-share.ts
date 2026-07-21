import { Elysia } from 'elysia';
import {
  CollectionShareAcceptRequest,
  CollectionShareAcceptResponse,
  CollectionShareInviteCreateResponse,
  CollectionShareInvitePreviewResponse,
  CollectionShareLeaveResponse,
  CollectionShareStatusResponse,
} from '@riftbound/contracts';
import type { Auth } from '../auth.js';
import { getSessionUser, unauthorized } from '../lib/session.js';
import {
  CollectionShareError,
  type CollectionShareService,
} from '../services/collection-share-service.js';

function shareErrorStatus(error: CollectionShareError): number {
  switch (error.code) {
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
      return 409;
    case 'FORBIDDEN':
      return 403;
    default:
      return 400;
  }
}

export function createCollectionShareRoutes(share: CollectionShareService, auth: Auth) {
  return new Elysia({ prefix: '/api/v1/collection/share' })
    .get(
      '/',
      async ({ request, set }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const status = await share.getStatus(user.id);
        return CollectionShareStatusResponse.parse({ data: status });
      },
      { detail: { tags: ['collection-share'] } }
    )
    .post(
      '/invite',
      async ({ request, set }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        try {
          const invite = await share.createInvite(user.id);
          return CollectionShareInviteCreateResponse.parse({ data: invite });
        } catch (error) {
          if (error instanceof CollectionShareError) {
            set.status = shareErrorStatus(error);
            return { error: error.code, message: error.message };
          }
          throw error;
        }
      },
      { detail: { tags: ['collection-share'] } }
    )
    .post(
      '/invite/revoke',
      async ({ request, set }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        await share.revokeInvite(user.id);
        return { data: { ok: true } };
      },
      { detail: { tags: ['collection-share'] } }
    )
    .get(
      '/invite/:token',
      async ({ request, set, params }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        try {
          const preview = await share.previewInvite(user.id, params.token);
          return CollectionShareInvitePreviewResponse.parse({ data: preview });
        } catch (error) {
          if (error instanceof CollectionShareError) {
            set.status = shareErrorStatus(error);
            return { error: error.code, message: error.message };
          }
          throw error;
        }
      },
      { detail: { tags: ['collection-share'] } }
    )
    .post(
      '/invite/:token/accept',
      async ({ request, set, params, body }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const parsed = CollectionShareAcceptRequest.parse(body);
        try {
          const status = await share.acceptInvite(user.id, params.token, parsed.mode);
          return CollectionShareAcceptResponse.parse({ data: status });
        } catch (error) {
          if (error instanceof CollectionShareError) {
            set.status = shareErrorStatus(error);
            return { error: error.code, message: error.message };
          }
          throw error;
        }
      },
      { detail: { tags: ['collection-share'] } }
    )
    .post(
      '/leave',
      async ({ request, set }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        try {
          const status = await share.leave(user.id);
          return CollectionShareLeaveResponse.parse({ data: status });
        } catch (error) {
          if (error instanceof CollectionShareError) {
            set.status = shareErrorStatus(error);
            return { error: error.code, message: error.message };
          }
          throw error;
        }
      },
      { detail: { tags: ['collection-share'] } }
    );
}
