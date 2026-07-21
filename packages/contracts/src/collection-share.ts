import { z } from 'zod';

export const CollectionShareAcceptMode = z.enum(['use_theirs', 'merge']);
export type CollectionShareAcceptMode = z.infer<typeof CollectionShareAcceptMode>;

export const CollectionSharePartner = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export type CollectionSharePartner = z.infer<typeof CollectionSharePartner>;

export const CollectionSharePendingInvite = z.object({
  token: z.string(),
  url: z.string(),
  expiresAt: z.string().datetime(),
});

export type CollectionSharePendingInvite = z.infer<typeof CollectionSharePendingInvite>;

export const CollectionShareStatus = z.object({
  shared: z.boolean(),
  memberCount: z.number().int().positive(),
  collectionId: z.string().uuid(),
  role: z.enum(['owner', 'member']),
  partner: CollectionSharePartner.nullable(),
  pendingInvite: CollectionSharePendingInvite.nullable(),
});

export type CollectionShareStatus = z.infer<typeof CollectionShareStatus>;

export const CollectionShareStatusResponse = z.object({
  data: CollectionShareStatus,
});

export type CollectionShareStatusResponse = z.infer<typeof CollectionShareStatusResponse>;

export const CollectionShareInviteCreateResponse = z.object({
  data: CollectionSharePendingInvite,
});

export type CollectionShareInviteCreateResponse = z.infer<
  typeof CollectionShareInviteCreateResponse
>;

export const CollectionShareInvitePreview = z.object({
  token: z.string(),
  expiresAt: z.string().datetime(),
  inviter: CollectionSharePartner,
  theirItemCount: z.number().int().nonnegative(),
  theirTotalQuantity: z.number().int().nonnegative(),
  yourItemCount: z.number().int().nonnegative(),
  yourTotalQuantity: z.number().int().nonnegative(),
  canAccept: z.boolean(),
  reason: z.string().nullable(),
});

export type CollectionShareInvitePreview = z.infer<typeof CollectionShareInvitePreview>;

export const CollectionShareInvitePreviewResponse = z.object({
  data: CollectionShareInvitePreview,
});

export type CollectionShareInvitePreviewResponse = z.infer<
  typeof CollectionShareInvitePreviewResponse
>;

export const CollectionShareAcceptRequest = z.object({
  mode: CollectionShareAcceptMode,
});

export type CollectionShareAcceptRequest = z.infer<typeof CollectionShareAcceptRequest>;

export const CollectionShareAcceptResponse = z.object({
  data: CollectionShareStatus,
});

export type CollectionShareAcceptResponse = z.infer<typeof CollectionShareAcceptResponse>;

export const CollectionShareLeaveResponse = z.object({
  data: CollectionShareStatus,
});

export type CollectionShareLeaveResponse = z.infer<typeof CollectionShareLeaveResponse>;
