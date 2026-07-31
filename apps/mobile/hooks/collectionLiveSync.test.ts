import { describe, expect, test } from 'bun:test';
import { QueryClient } from '@tanstack/react-query';
import {
  collectionSharePollInterval,
  collectionMutationsPending,
  flushCollectionLiveInvalidate,
  onCollectionLiveChanged,
} from '@/hooks/collectionLiveSync';
import { collectionMutationKey, collectionQueryKeys } from '@/src/api/queryKeys';

describe('collectionLiveSync', () => {
  test('polls only while waiting for a pending invite to be accepted', () => {
    const soloStatus = {
      shared: false,
      memberCount: 1,
      collectionId: '00000000-0000-4000-8000-000000000001',
      role: 'owner' as const,
      partner: null,
      pendingInvite: null,
    };
    const pendingStatus = {
      ...soloStatus,
      pendingInvite: {
        token: 'invite-token',
        url: 'https://example.com/invite',
        expiresAt: '2026-08-01T00:00:00.000Z',
      },
    };

    expect(collectionSharePollInterval(undefined)).toBe(false);
    expect(collectionSharePollInterval(soloStatus)).toBe(false);
    expect(collectionSharePollInterval(pendingStatus)).toBe(5_000);
    expect(collectionSharePollInterval({ ...pendingStatus, shared: true })).toBe(false);
  });

  test('invalidates collection queries immediately when idle', async () => {
    const client = new QueryClient();
    client.setQueryDefaults(collectionQueryKeys.all, {
      queryFn: async () => [],
    });
    client.setQueryDefaults(collectionQueryKeys.ownershipRoot, {
      queryFn: async () => ({}),
    });

    await client.prefetchQuery({ queryKey: collectionQueryKeys.all });
    await client.prefetchQuery({ queryKey: collectionQueryKeys.ownershipRoot });

    expect(client.getQueryState(collectionQueryKeys.all)?.isInvalidated).toBe(false);
    expect(onCollectionLiveChanged(client)).toBe(false);
    expect(client.getQueryState(collectionQueryKeys.all)?.isInvalidated).toBe(true);
    expect(client.getQueryState(collectionQueryKeys.ownershipRoot)?.isInvalidated).toBe(
      true
    );
  });

  test('defers invalidate while a collection mutation is in flight, then flushes', async () => {
    const client = new QueryClient();
    client.setQueryDefaults(collectionQueryKeys.all, {
      queryFn: async () => [],
    });
    client.setQueryDefaults(collectionQueryKeys.ownershipRoot, {
      queryFn: async () => ({}),
    });

    await client.prefetchQuery({ queryKey: collectionQueryKeys.all });
    await client.prefetchQuery({ queryKey: collectionQueryKeys.ownershipRoot });

    let resolveMutation!: () => void;
    const mutationPromise = new Promise<void>((resolve) => {
      resolveMutation = resolve;
    });

    const mutation = client.getMutationCache().build(client, {
      mutationKey: collectionMutationKey,
      mutationFn: () => mutationPromise,
    });
    const run = mutation.execute(undefined);
    expect(collectionMutationsPending(client)).toBe(true);

    expect(onCollectionLiveChanged(client)).toBe(true);
    expect(client.getQueryState(collectionQueryKeys.all)?.isInvalidated).toBe(false);

    expect(flushCollectionLiveInvalidate(client, true)).toBe(true);
    expect(client.getQueryState(collectionQueryKeys.all)?.isInvalidated).toBe(false);

    resolveMutation();
    await run;
    expect(collectionMutationsPending(client)).toBe(false);

    expect(flushCollectionLiveInvalidate(client, true)).toBe(false);
    expect(client.getQueryState(collectionQueryKeys.all)?.isInvalidated).toBe(true);
    expect(client.getQueryState(collectionQueryKeys.ownershipRoot)?.isInvalidated).toBe(
      true
    );
  });

  test('flush is a no-op when nothing is pending', () => {
    const client = new QueryClient();
    expect(flushCollectionLiveInvalidate(client, false)).toBe(false);
  });
});
