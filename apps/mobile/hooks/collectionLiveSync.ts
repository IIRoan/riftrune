import type { QueryClient } from '@tanstack/react-query';
import type { CollectionShareStatus } from '@riftbound/contracts';
import { collectionMutationKey, collectionQueryKeys } from '@/src/api/queryKeys';

const PENDING_SHARE_POLL_MS = 5_000;

export function collectionSharePollInterval(
  status: CollectionShareStatus | undefined
): number | false {
  return status?.shared === false && status.pendingInvite !== null
    ? PENDING_SHARE_POLL_MS
    : false;
}

export function collectionMutationsPending(queryClient: QueryClient): boolean {
  return queryClient.isMutating({ mutationKey: collectionMutationKey }) > 0;
}

export function invalidateCollectionFromLive(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({
    queryKey: collectionQueryKeys.all,
    exact: true,
  });
  void queryClient.invalidateQueries({
    queryKey: collectionQueryKeys.ownershipRoot,
  });
  void queryClient.invalidateQueries({
    queryKey: collectionQueryKeys.recentAddsRoot,
  });
}

/** Handle remote collection.changed; returns whether invalidate stays deferred until mutations settle. */
export function onCollectionLiveChanged(queryClient: QueryClient): boolean {
  if (collectionMutationsPending(queryClient)) return true;
  invalidateCollectionFromLive(queryClient);
  return false;
}

/** Flush a deferred live invalidate once collection mutations have settled. */
export function flushCollectionLiveInvalidate(
  queryClient: QueryClient,
  pendingInvalidate: boolean
): boolean {
  if (!pendingInvalidate || collectionMutationsPending(queryClient)) {
    return pendingInvalidate;
  }
  invalidateCollectionFromLive(queryClient);
  return false;
}
