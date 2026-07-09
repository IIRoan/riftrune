import { z } from 'zod';
import { Elysia } from 'elysia';
import {
  CardCondition,
  CollectionBatchSyncRequest,
  CollectionImportRequest,
  CollectionImportResponse,
  CollectionListResponse,
  CollectionItemResponse,
  CollectionQuantitiesRequest,
  CollectionQuantitiesResponse,
  CollectionUpsertRequest,
} from '@riftbound/contracts';
import type { CollectionItem as CollectionItemDto } from '@riftbound/contracts';
import type { Auth } from '../auth.js';
import { logActionFailure } from '../lib/logger.js';
import { getSessionUser, unauthorized } from '../lib/session.js';
import type { CollectionService } from '../services/collection-service.js';

const AdjustBody = z.object({
  delta: z.number().int().positive().optional(),
  condition: CardCondition.optional(),
  language: z.string().optional(),
});

const _UpsertBody = CollectionUpsertRequest.omit({ variantNumber: true });

function collectionItemResponse(
  action: string,
  item: CollectionItemDto | null,
  context?: Record<string, unknown>
) {
  if (!item) return { data: null };
  const parsed = CollectionItemResponse.safeParse({ data: item });
  if (!parsed.success) {
    logActionFailure(action, parsed.error, {
      ...context,
      variantNumber: item.variantNumber,
    });
    return { data: null };
  }
  return parsed.data;
}

function parseCollectionList(action: string, result: Awaited<ReturnType<CollectionService['listForUser']>>) {
  const parsed = CollectionListResponse.safeParse({
    data: result.items,
    meta: { total: result.total, totalQuantity: result.totalQuantity },
  });
  if (!parsed.success) {
    logActionFailure(action, parsed.error, { total: result.total });
    throw new Error('Collection list response validation failed');
  }
  return parsed.data;
}

export function createCollectionRoutes(collection: CollectionService, auth: Auth) {
  return new Elysia({ prefix: '/api/v1/collection' })
    .get(
      '/',
      async ({ request, set }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const result = await collection.listForUser(user.id);
        return parseCollectionList('collection.list', result);
      },
      { detail: { tags: ['collection'] } }
    )
    .post(
      '/quantities',
      async ({ request, set, body }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const { variantNumbers } = CollectionQuantitiesRequest.parse(body);
        const rows = await collection.quantitiesForVariants(user.id, variantNumbers);
        return CollectionQuantitiesResponse.parse({ data: rows });
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
        return collectionItemResponse('collection.upsert', item, {
          variantNumber: parsed.variantNumber,
        });
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
        const condition = parsed.success
          ? (parsed.data.condition ?? 'near_mint')
          : 'near_mint';
        const language = parsed.success ? (parsed.data.language ?? 'en') : 'en';

        const item = await collection.adjustQuantity(
          user.id,
          params.variantNumber,
          delta,
          {
            condition,
            language,
          }
        );
        if (!item) return { data: null };
        return collectionItemResponse('collection.add', item, {
          variantNumber: params.variantNumber,
          delta,
        });
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
        const condition = parsed.success
          ? (parsed.data.condition ?? 'near_mint')
          : 'near_mint';
        const language = parsed.success ? (parsed.data.language ?? 'en') : 'en';

        const item = await collection.adjustQuantity(
          user.id,
          params.variantNumber,
          -delta,
          {
            condition,
            language,
          }
        );
        if (!item) return { data: null };
        return collectionItemResponse('collection.remove', item, {
          variantNumber: params.variantNumber,
          delta,
        });
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
        await collection.remove(
          user.id,
          params.variantNumber,
          condition,
          query.language ?? 'en'
        );
        return { data: { ok: true } };
      },
      { detail: { tags: ['collection'] } }
    )
    .delete(
      '/all',
      async ({ request, set }) => {
        if (process.env.NODE_ENV === 'production') {
          set.status = 404;
          return { error: 'Not found' };
        }
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const result = await collection.clearAll(user.id);
        return { data: result };
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
    )
    .get(
      '/export',
      async ({ request, set }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const csv = await collection.exportForUser(user.id);
        set.headers['content-type'] = 'text/csv; charset=utf-8';
        set.headers['content-disposition'] =
          'attachment; filename="piltover-collection-export.csv"';
        return csv;
      },
      { detail: { tags: ['collection'] } }
    )
    .post(
      '/import',
      async ({ request, set, body }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const parsed = CollectionImportRequest.parse(body);
        if (parsed.items && parsed.items.length > 0) {
          const result = await collection.importItems(
            user.id,
            parsed.items.map((item) => ({
              variantNumber: item.variantNumber,
              quantity: item.quantity,
              condition: item.condition,
              language: item.language,
              notes: item.notes ?? null,
              isGraded: item.isGraded ?? false,
              gradeCompany: item.gradeCompany ?? null,
              gradeScore: item.gradeScore ?? null,
            }))
          );
          return CollectionImportResponse.parse({ data: result });
        }
        if (!parsed.csv) {
          set.status = 400;
          return { error: 'Provide csv or items' };
        }
        const result = await collection.importCsv(user.id, parsed.csv);
        return CollectionImportResponse.parse({ data: result });
      },
      { detail: { tags: ['collection'] } }
    );
}
