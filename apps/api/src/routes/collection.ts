import { z } from 'zod';
import { Elysia, sse } from 'elysia';
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
  type CollectionLiveChangeReason,
  type CollectionLiveChangedEvent,
} from '@riftbound/contracts';
import type { CollectionItem as CollectionItemDto } from '@riftbound/contracts';
import type { Auth } from '../auth.js';
import { logActionFailure } from '../lib/logger.js';
import { getSessionUser, unauthorized } from '../lib/session.js';
import type { Database } from '../db/client.js';
import { ensureCollectionMembership } from '../services/collection-membership.js';
import type { CollectionService } from '../services/collection-service.js';
import {
  collectionLiveHub,
  type CollectionLiveHub,
} from '../services/collection-live-hub.js';

const AdjustBody = z.object({
  delta: z.number().int().positive().optional(),
  condition: CardCondition.optional(),
  language: z.string().optional(),
  isFoil: z.boolean().optional(),
});

const _UpsertBody = CollectionUpsertRequest.omit({ variantNumber: true });

const HEARTBEAT_MS = 25_000;

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

function parseCollectionList(
  action: string,
  result: Awaited<ReturnType<CollectionService['listForCollection']>>
) {
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

function notifyLive(
  hub: CollectionLiveHub,
  collectionId: string,
  reason: CollectionLiveChangeReason,
  actorUserId: string
) {
  hub.publish(collectionId, reason, actorUserId);
}

async function* streamCollectionLiveEvents(
  request: Request,
  collectionId: string,
  liveHub: CollectionLiveHub
) {
  const queue: CollectionLiveChangedEvent[] = [];
  let wake: (() => void) | null = null;
  const push = (event: CollectionLiveChangedEvent) => {
    queue.push(event);
    wake?.();
  };
  const unsub = liveHub.subscribe(collectionId, push);
  const onAbort = () => {
    wake?.();
  };
  request.signal.addEventListener('abort', onAbort);

  try {
    yield sse({
      event: 'ready',
      data: { type: 'ready', collectionId },
    });

    while (!request.signal.aborted) {
      const waited = await Promise.race([
        new Promise<'event'>((resolve) => {
          wake = () => {
            resolve('event');
          };
          if (queue.length > 0) resolve('event');
        }),
        new Promise<'heartbeat'>((resolve) => {
          setTimeout(() => {
            resolve('heartbeat');
          }, HEARTBEAT_MS);
        }),
      ]);
      wake = null;

      while (queue.length > 0) {
        const event = queue.shift();
        if (!event) break;
        yield sse({
          event: event.type,
          data: event,
        });
      }

      if (waited === 'heartbeat' && !request.signal.aborted) {
        yield sse({
          event: 'heartbeat',
          data: { type: 'heartbeat', at: new Date().toISOString() },
        });
      }
    }
  } finally {
    request.signal.removeEventListener('abort', onAbort);
    unsub();
  }
}

export function createCollectionRoutes(
  collection: CollectionService,
  auth: Auth,
  db: Database,
  liveHub: CollectionLiveHub = collectionLiveHub
) {
  return new Elysia({ prefix: '/api/v1/collection' })
    .get(
      '/',
      async ({ request, set }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        const result = await collection.listForCollection(collectionId);
        return parseCollectionList('collection.list', result);
      },
      { detail: { tags: ['collection'] } }
    )
    .get(
      '/events',
      async ({ request, set }) => {
        const user = await getSessionUser(auth, request.headers);
        if (!user) {
          set.status = 401;
          return unauthorized();
        }
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        return streamCollectionLiveEvents(request, collectionId, liveHub);
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
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        const { variantNumbers } = CollectionQuantitiesRequest.parse(body);
        const rows = await collection.quantitiesForVariants(
          collectionId,
          variantNumbers
        );
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
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        const parsed = CollectionUpsertRequest.parse({
          ...(body as z.infer<typeof _UpsertBody>),
          variantNumber: params.variantNumber,
        });
        const item = await collection.upsert(collectionId, {
          variantNumber: parsed.variantNumber,
          quantity: parsed.quantity,
          condition: parsed.condition,
          language: parsed.language,
          ...(parsed.isFoil === undefined ? {} : { isFoil: parsed.isFoil }),
          notes: parsed.notes ?? null,
          isGraded: parsed.isGraded ?? false,
          gradeCompany: parsed.gradeCompany ?? null,
          gradeScore: parsed.gradeScore ?? null,
          acquiredAt: parsed.acquiredAt ?? null,
          acquiredPriceCents: parsed.acquiredPriceCents ?? null,
        });
        notifyLive(liveHub, collectionId, 'upsert', user.id);
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
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        const parsed = AdjustBody.safeParse(body);
        const delta = parsed.success && parsed.data.delta ? parsed.data.delta : 1;
        const condition = parsed.success
          ? (parsed.data.condition ?? 'near_mint')
          : 'near_mint';
        const language = parsed.success ? (parsed.data.language ?? 'en') : 'en';

        const item = await collection.adjustQuantity(
          collectionId,
          params.variantNumber,
          delta,
          {
            condition,
            language,
            ...(parsed.success && parsed.data.isFoil !== undefined
              ? { isFoil: parsed.data.isFoil }
              : {}),
          }
        );
        notifyLive(liveHub, collectionId, 'add', user.id);
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
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        const parsed = AdjustBody.safeParse(body);
        const delta = parsed.success && parsed.data.delta ? parsed.data.delta : 1;
        const condition = parsed.success
          ? (parsed.data.condition ?? 'near_mint')
          : 'near_mint';
        const language = parsed.success ? (parsed.data.language ?? 'en') : 'en';

        const item = await collection.adjustQuantity(
          collectionId,
          params.variantNumber,
          -delta,
          {
            condition,
            language,
            ...(parsed.success && parsed.data.isFoil !== undefined
              ? { isFoil: parsed.data.isFoil }
              : {}),
          }
        );
        notifyLive(liveHub, collectionId, 'remove', user.id);
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
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        const condition = CardCondition.safeParse(query.condition).success
          ? CardCondition.parse(query.condition)
          : 'near_mint';
        const isFoilQuery =
          query.isFoil === 'true' ? true : query.isFoil === 'false' ? false : undefined;
        await collection.remove(
          collectionId,
          params.variantNumber,
          condition,
          query.language ?? 'en',
          isFoilQuery
        );
        notifyLive(liveHub, collectionId, 'delete', user.id);
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
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        const result = await collection.clearAll(collectionId);
        notifyLive(liveHub, collectionId, 'clear', user.id);
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
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        const { items } = CollectionBatchSyncRequest.parse(body);
        const result = await collection.batchSync(collectionId, items);
        notifyLive(liveHub, collectionId, 'batch', user.id);
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
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        const csv = await collection.exportForCollection(collectionId);
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
        const { collectionId } = await ensureCollectionMembership(db, user.id);
        const parsed = CollectionImportRequest.parse(body);
        if (parsed.items && parsed.items.length > 0) {
          const result = await collection.importItems(
            collectionId,
            parsed.items.map((item) => ({
              variantNumber: item.variantNumber,
              quantity: item.quantity,
              condition: item.condition,
              language: item.language,
              ...(item.isFoil === undefined ? {} : { isFoil: item.isFoil }),
              notes: item.notes ?? null,
              isGraded: item.isGraded ?? false,
              gradeCompany: item.gradeCompany ?? null,
              gradeScore: item.gradeScore ?? null,
            }))
          );
          notifyLive(liveHub, collectionId, 'import', user.id);
          return CollectionImportResponse.parse({ data: result });
        }
        if (!parsed.csv) {
          set.status = 400;
          return { error: 'Provide csv or items' };
        }
        const result = await collection.importCsv(collectionId, parsed.csv);
        notifyLive(liveHub, collectionId, 'import', user.id);
        return CollectionImportResponse.parse({ data: result });
      },
      { detail: { tags: ['collection'] } }
    );
}
