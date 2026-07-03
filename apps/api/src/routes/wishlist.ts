import type { z } from 'zod';
import { Elysia } from 'elysia';
import {
  WishlistItemResponse,
  WishlistListResponse,
  WishlistUpsertRequest,
} from '@riftbound/contracts';
import type { Auth } from '../auth.js';
import { getSessionUser, unauthorized } from '../lib/session.js';
import type { WishlistService } from '../services/wishlist-service.js';

const _UpsertBody = WishlistUpsertRequest.omit({ variantNumber: true });

export function createWishlistRoutes(wishlist: WishlistService, auth: Auth) {
  return new Elysia({ prefix: '/api/v1/wishlist' })
    .get(
      '/',
      async ({ request, set }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const result = await wishlist.listForUser(user.id);
        return WishlistListResponse.parse({
          data: result.items,
          meta: { total: result.total },
        });
      },
      { detail: { tags: ['wishlist'] } }
    )
    .put(
      '/:variantNumber',
      async ({ request, set, params, body }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const parsed = WishlistUpsertRequest.parse({
          ...(body as z.infer<typeof _UpsertBody>),
          variantNumber: params.variantNumber,
        });
        const item = await wishlist.upsert(user.id, {
          variantNumber: parsed.variantNumber,
          priority: parsed.priority,
          targetPriceCents: parsed.targetPriceCents ?? null,
          notes: parsed.notes ?? null,
        });
        return WishlistItemResponse.parse({ data: item });
      },
      { detail: { tags: ['wishlist'] } }
    )
    .delete(
      '/:variantNumber',
      async ({ request, set, params }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        await wishlist.remove(user.id, params.variantNumber);
        return { data: { ok: true } };
      },
      { detail: { tags: ['wishlist'] } }
    );
}
