import { z } from 'zod';
import { CardCondition } from './collection.js';

export const CollectionAuditAction = z.enum([
  'add',
  'remove',
  'upsert',
  'delete',
  'clear',
  'batch',
  'import',
  'share_merge',
  'share_discard',
  'share_leave',
]);

export type CollectionAuditAction = z.infer<typeof CollectionAuditAction>;

export const CollectionAuditActor = z.object({
  userId: z.string().min(1),
  name: z.string().nullable(),
  email: z.string().nullable(),
});

export type CollectionAuditActor = z.infer<typeof CollectionAuditActor>;

export const CollectionAuditEvent = z.object({
  id: z.string().uuid(),
  collectionId: z.string().uuid().nullable(),
  action: CollectionAuditAction,
  variantNumber: z.string().nullable(),
  condition: CardCondition.nullable(),
  language: z.string().nullable(),
  isFoil: z.boolean().nullable(),
  quantityBefore: z.number().int().nullable(),
  quantityAfter: z.number().int().nullable(),
  quantityDelta: z.number().int().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
  actor: CollectionAuditActor,
});

export type CollectionAuditEvent = z.infer<typeof CollectionAuditEvent>;

export const CollectionAuditListQuery = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
  /** ISO timestamp cursor — return events strictly older than this. */
  before: z.string().datetime().optional(),
  variantNumber: z.string().min(1).optional(),
  /** Filter to a specific actor (must be a member of the collection). */
  actorUserId: z.string().min(1).optional(),
  /** When true, only events performed by the authenticated user. */
  mine: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === '1';
    }),
  action: CollectionAuditAction.optional(),
});

export type CollectionAuditListQuery = z.infer<typeof CollectionAuditListQuery>;

export const CollectionAuditListResponse = z.object({
  data: z.array(CollectionAuditEvent),
  meta: z.object({
    total: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
});

export type CollectionAuditListResponse = z.infer<typeof CollectionAuditListResponse>;
