import { z } from 'zod';
import { Elysia } from 'elysia';
import {
  CardCondition,
  CollectionBatchSyncRequest,
  CollectionListResponse,
  CollectionItemResponse,
  CollectionUpsertRequest,
} from '@riftbound/contracts';
import type { Auth } from '../auth.js';
import { getSessionUser, unauthorized } from '../lib/session.js';
import type { CollectionService } from '../services/collection-service.js';

const AdjustBody = z.object({
  delta: z.number().int().positive().optional(),
  condition: CardCondition.optional(),
  language: z.string().optional(),
});

const _UpsertBody = CollectionUpsertRequest.omit({ variantNumber: true });

export function createCollectionRoutes(collection: CollectionService, auth: Auth) {
  return new Elysia({ prefix: '/v1/collection' })
    .get(
      '/',
      async ({ request, set }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const result = await collection.listForUser(user.id);
        return CollectionListResponse.parse({
          data: result.items,
          meta: { total: result.total, totalQuantity: result.totalQuantity },
        });
      },
      { detail: { tags: ['collection'] } }
    )
    .put(
      '/:variantNumber',
      async ({ request, set, params, body }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const parsed = CollectionUpsertRequest.parse({
          ...(body as z.infer<typeof _UpsertBody>),
          variantNumber: params.variantNumber,
        });
        const item = await collection.upsert(user.id, {
          variantNumber: parsed.variantNumber,
          quantity: parsed.quantity,
          condition: parsed.condition,
          language: parsed.language,
          notes: parsed.notes ?? null,
          isGraded: parsed.isGraded ?? false,
          gradeCompany: parsed.gradeCompany ?? null,
          gradeScore: parsed.gradeScore ?? null,
          acquiredAt: parsed.acquiredAt ?? null,
          acquiredPriceCents: parsed.acquiredPriceCents ?? null,
        });
        if (!item) {
          return { data: null };
        }
        return CollectionItemResponse.parse({ data: item });
      },
      { detail: { tags: ['collection'] } }
    )
    .post(
      '/:variantNumber/add',
      async ({ request, set, params, body }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const parsed = AdjustBody.safeParse(body);
        const delta = parsed.success && parsed.data.delta ? parsed.data.delta : 1;
        const condition = parsed.success ? (parsed.data.condition ?? 'near_mint') : 'near_mint';
        const language = parsed.success ? (parsed.data.language ?? 'en') : 'en';

        const item = await collection.adjustQuantity(user.id, params.variantNumber, delta, {
          condition,
          language,
        });
        if (!item) return { data: null };
        return CollectionItemResponse.parse({ data: item });
      },
      { detail: { tags: ['collection'] } }
    )
    .post(
      '/:variantNumber/remove',
      async ({ request, set, params, body }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const parsed = AdjustBody.safeParse(body);
        const delta = parsed.success && parsed.data.delta ? parsed.data.delta : 1;
        const condition = parsed.success ? (parsed.data.condition ?? 'near_mint') : 'near_mint';
        const language = parsed.success ? (parsed.data.language ?? 'en') : 'en';

        const item = await collection.adjustQuantity(user.id, params.variantNumber, -delta, {
          condition,
          language,
        });
        if (!item) return { data: null };
        return CollectionItemResponse.parse({ data: item });
      },
      { detail: { tags: ['collection'] } }
    )
    .delete(
      '/:variantNumber',
      async ({ request, set, params, query }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const condition = CardCondition.safeParse(query.condition).success
          ? CardCondition.parse(query.condition)
          : 'near_mint';
        await collection.remove(user.id, params.variantNumber, condition, query.language ?? 'en');
        return { data: { ok: true } };
      },
      { detail: { tags: ['collection'] } }
    )
    .post(
      '/batch',
      async ({ request, set, body }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const { items } = CollectionBatchSyncRequest.parse(body);
        const result = await collection.batchSync(user.id, items);
        return { data: result };
      },
      { detail: { tags: ['collection'] } }
    );
}
