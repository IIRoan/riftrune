import { describe, expect, mock, test } from 'bun:test';
import { QueryClient } from '@tanstack/react-query';

mock.module('react-native', () => ({
  AppState: {
    addEventListener: () => ({ remove: () => {} }),
  },
  Platform: { OS: 'ios' },
}));

const {
  createQueryClient,
  invalidateCatalogQueries,
  invalidateUserDataQueries,
  removeUserDataQueries,
} = await import('@/src/api/queryClient');
import {
  cardQueryKeys,
  catalogQueryKeys,
  collectionQueryKeys,
  deckQueryKeys,
  wishlistQueryKeys,
} from '@/src/api/queryKeys';

describe('createQueryClient', () => {
  test('enables focus and reconnect refetch by default', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.refetchOnWindowFocus).toBe(true);
    expect(defaults?.refetchOnReconnect).toBe(true);
    expect(defaults?.staleTime).toBe(60_000);
  });
});

describe('query invalidation helpers', () => {
  test('invalidateUserDataQueries marks account lists stale', async () => {
    const client = new QueryClient();
    const fetchers = {
      collection: 0,
      ownership: 0,
      wishlist: 0,
      decks: 0,
    };

    client.setQueryDefaults(collectionQueryKeys.all, {
      queryFn: async () => {
        fetchers.collection += 1;
        return [];
      },
    });
    client.setQueryDefaults(collectionQueryKeys.ownershipRoot, {
      queryFn: async () => {
        fetchers.ownership += 1;
        return {};
      },
    });
    client.setQueryDefaults(wishlistQueryKeys.all, {
      queryFn: async () => {
        fetchers.wishlist += 1;
        return [];
      },
    });
    client.setQueryDefaults(deckQueryKeys.all, {
      queryFn: async () => {
        fetchers.decks += 1;
        return [];
      },
    });

    await client.prefetchQuery({ queryKey: collectionQueryKeys.all });
    await client.prefetchQuery({ queryKey: collectionQueryKeys.ownershipRoot });
    await client.prefetchQuery({ queryKey: wishlistQueryKeys.all });
    await client.prefetchQuery({ queryKey: deckQueryKeys.all });

    await invalidateUserDataQueries(client);

    await client.fetchQuery({ queryKey: collectionQueryKeys.all });
    await client.fetchQuery({ queryKey: wishlistQueryKeys.all });

    expect(fetchers.collection).toBe(2);
    expect(fetchers.wishlist).toBe(2);
  });

  test('removeUserDataQueries clears cached account data', () => {
    const client = new QueryClient();
    client.setQueryData(collectionQueryKeys.all, [{ variantNumber: 'OGN-001', quantity: 1 }]);
    client.setQueryData(wishlistQueryKeys.all, [{ variantNumber: 'OGN-001' }]);
    client.setQueryData(wishlistQueryKeys.prices, [{ variantNumber: 'OGN-001' }]);

    removeUserDataQueries(client);

    expect(client.getQueryData(collectionQueryKeys.all)).toBeUndefined();
    expect(client.getQueryData(wishlistQueryKeys.all)).toBeUndefined();
    expect(client.getQueryData(wishlistQueryKeys.prices)).toBeUndefined();
  });

  test('wishlist prices refetch reads fresh membership after invalidation', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: 60_000 } },
    });
    let wishlistFetches = 0;

    client.setQueryData(wishlistQueryKeys.all, [{ variantNumber: 'OLD' }]);
    client.setQueryData(wishlistQueryKeys.prices, [{ variantNumber: 'OLD' }]);

    await client.invalidateQueries({ queryKey: wishlistQueryKeys.all });
    await client.invalidateQueries({ queryKey: wishlistQueryKeys.prices });

    // ensureQueryData would return the invalidated cache; fetchQuery must refetch.
    const membership = await client.fetchQuery({
      queryKey: wishlistQueryKeys.all,
      queryFn: async () => {
        wishlistFetches += 1;
        return [{ variantNumber: 'NEW' }];
      },
    });

    expect(membership).toEqual([{ variantNumber: 'NEW' }]);
    expect(wishlistFetches).toBe(1);
    expect(client.getQueryState(wishlistQueryKeys.prices)?.isInvalidated).toBe(true);
  });

  test('invalidateCatalogQueries targets catalog and browse keys', async () => {
    const client = new QueryClient();
    let catalogFetches = 0;

    client.setQueryDefaults(catalogQueryKeys.index, {
      queryFn: async () => {
        catalogFetches += 1;
        return { items: [] };
      },
    });

    await client.prefetchQuery({ queryKey: catalogQueryKeys.index });
    await invalidateCatalogQueries(client);
    await client.fetchQuery({ queryKey: catalogQueryKeys.index });

    expect(catalogFetches).toBe(2);
    expect(cardQueryKeys.browse()).toEqual(['cards', 'browse', 'default']);
  });
});
