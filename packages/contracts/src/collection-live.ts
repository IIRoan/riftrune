import { z } from 'zod';

export const CollectionLiveChangeReason = z.enum([
  'upsert',
  'add',
  'remove',
  'delete',
  'clear',
  'batch',
  'import',
]);

export type CollectionLiveChangeReason = z.infer<typeof CollectionLiveChangeReason>;

export const CollectionLiveChangedEvent = z.object({
  type: z.literal('collection.changed'),
  collectionId: z.string().uuid(),
  reason: CollectionLiveChangeReason,
  actorUserId: z.string().min(1),
  at: z.string().datetime(),
});

export type CollectionLiveChangedEvent = z.infer<typeof CollectionLiveChangedEvent>;

export const CollectionLiveReadyEvent = z.object({
  type: z.literal('ready'),
  collectionId: z.string().uuid(),
});

export type CollectionLiveReadyEvent = z.infer<typeof CollectionLiveReadyEvent>;

export const CollectionLiveHeartbeatEvent = z.object({
  type: z.literal('heartbeat'),
  at: z.string().datetime(),
});

export type CollectionLiveHeartbeatEvent = z.infer<typeof CollectionLiveHeartbeatEvent>;

export const CollectionLiveEvent = z.discriminatedUnion('type', [
  CollectionLiveChangedEvent,
  CollectionLiveReadyEvent,
  CollectionLiveHeartbeatEvent,
]);

export type CollectionLiveEvent = z.infer<typeof CollectionLiveEvent>;
