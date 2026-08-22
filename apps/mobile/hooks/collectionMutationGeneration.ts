import type { QueryClient } from '@tanstack/react-query';

/** Bumped on mutation start so in-flight list/quantities responses cannot clobber optimistic cache. */
const collectionMutationGeneration = new WeakMap<QueryClient, number>();

export function bumpCollectionMutationGeneration(queryClient: QueryClient): number {
  const next = (collectionMutationGeneration.get(queryClient) ?? 0) + 1;
  collectionMutationGeneration.set(queryClient, next);
  return next;
}

export function getCollectionMutationGeneration(queryClient: QueryClient): number {
  return collectionMutationGeneration.get(queryClient) ?? 0;
}
