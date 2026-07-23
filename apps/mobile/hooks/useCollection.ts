import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { CardListItem } from '@riftbound/contracts';
import { useMemo } from 'react';
import { logActionFailure } from '@/lib/logger';
import {
  addDetailToCollection,
  addToCollection,
  getCollection,
  removeFromCollection,
  removeManyFromCollection,
  updateCollectionQuantity,
  type CollectionEntry,
} from '@/services/collectionService';
import {
  persistCollection,
  readPersistedCollection,
} from '@/services/collectionCacheService';
import { fetchRemoteCollectionQuantities } from '@/services/remoteCollectionService';
import { collectionQueryKeys } from '@/src/api/queryKeys';
import {
  findVariantByNumber,
  getCardPrintings,
  isFoilVariant,
  variantNumbersMatch,
} from '@/utils/variants';
import {
  mergeOwnershipFromCollection,
  mergeOwnershipRecords,
  ownershipMapFromRecord,
  type CollectionOwnershipMap,
} from '@/utils/collectionOwnership';

const COLLECTION_STALE_MS = 5 * 60 * 1000;
const OWNERSHIP_STALE_MS = 5 * 60 * 1000;

type OwnershipRecord = Record<string, number>;

export function getOwnershipRecord(queryClient: QueryClient): OwnershipRecord {
  return (
    queryClient.getQueryData<OwnershipRecord>(collectionQueryKeys.ownershipRoot) ?? {}
  );
}

export function syncOwnershipFromCollection(
  queryClient: QueryClient,
  entries: readonly CollectionEntry[]
) {
  const merged = mergeOwnershipFromCollection(getOwnershipRecord(queryClient), entries);
  queryClient.setQueryData(collectionQueryKeys.ownershipRoot, merged);
  queryClient.setQueriesData<OwnershipRecord>(
    { queryKey: collectionQueryKeys.ownershipRoot },
    () => merged
  );
}

function setOwnershipQuantity(
  queryClient: QueryClient,
  variantNumber: string,
  quantity: number
) {
  const current = getOwnershipRecord(queryClient);
  const merged = mergeOwnershipRecords(current, { [variantNumber]: quantity });
  queryClient.setQueryData(collectionQueryKeys.ownershipRoot, merged);
  queryClient.setQueriesData<OwnershipRecord>(
    { queryKey: collectionQueryKeys.ownershipRoot },
    () => merged
  );
}

export async function hydrateCollectionCache(queryClient: QueryClient): Promise<void> {
  const cached = await readPersistedCollection();
  if (!cached?.length) return;
  if (!queryClient.getQueryData<CollectionEntry[]>(collectionQueryKeys.all)) {
    queryClient.setQueryData(collectionQueryKeys.all, cached);
  }
  syncOwnershipFromCollection(queryClient, cached);
}

export function prefetchCollection(queryClient: QueryClient): Promise<void> {
  return queryClient.prefetchQuery({
    queryKey: collectionQueryKeys.all,
    queryFn: async () => {
      const entries = await getCollection();
      syncOwnershipFromCollection(queryClient, entries);
      await persistCollection(entries);
      return entries;
    },
    staleTime: COLLECTION_STALE_MS,
  });
}

export function useCollection(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: collectionQueryKeys.all,
    queryFn: async () => {
      const entries = await getCollection();
      syncOwnershipFromCollection(queryClient, entries);
      await persistCollection(entries);
      return entries;
    },
    staleTime: COLLECTION_STALE_MS,
    refetchOnMount: false,
    enabled: options?.enabled ?? true,
  });
}

export function useCollectionOwnership(variantNumbers: readonly string[]): {
  collectionByVariant: CollectionOwnershipMap;
  isLoading: boolean;
} {
  const queryClient = useQueryClient();
  const normalized = useMemo(
    () => [...new Set(variantNumbers.filter(Boolean))].sort(),
    [variantNumbers]
  );

  const ownershipQuery = useQuery({
    queryKey: collectionQueryKeys.ownership(normalized),
    queryFn: async () => {
      const cached = getOwnershipRecord(queryClient);
      const missing = normalized.filter(
        (variantNumber) => cached[variantNumber] === undefined
      );
      if (missing.length === 0) return cached;

      const rows = await fetchRemoteCollectionQuantities(missing);
      // Re-read after the await: an optimistic mutation may have filled these
      // keys while /quantities was in flight. Never clobber newer local values.
      const cachedNow = getOwnershipRecord(queryClient);
      const patch: OwnershipRecord = {};
      for (const row of rows) {
        if (cachedNow[row.variantNumber] !== undefined) continue;
        patch[row.variantNumber] = row.quantity;
      }
      const merged = mergeOwnershipRecords(cachedNow, patch);
      queryClient.setQueryData(collectionQueryKeys.ownershipRoot, merged);
      queryClient.setQueriesData<OwnershipRecord>(
        { queryKey: collectionQueryKeys.ownershipRoot },
        () => merged
      );
      return merged;
    },
    placeholderData: () => {
      const cached = getOwnershipRecord(queryClient);
      const hasAll = normalized.every(
        (variantNumber) => cached[variantNumber] !== undefined
      );
      return hasAll ? cached : undefined;
    },
    enabled: normalized.length > 0,
    staleTime: OWNERSHIP_STALE_MS,
    refetchOnMount: false,
  });

  const ownership = ownershipQuery.data ?? getOwnershipRecord(queryClient);
  const collectionByVariant = useMemo(
    () => ownershipMapFromRecord(ownership),
    [ownership]
  );

  return {
    collectionByVariant,
    isLoading: ownershipQuery.isLoading,
  };
}

type CollectionEntrySeed = Omit<
  CollectionEntry,
  'quantity' | 'addedAt' | 'updatedAt' | 'variantNumber'
>;

interface CollectionMutationContext {
  previousAll?: CollectionEntry[];
  previousEntry?: CollectionEntry | null | undefined;
  previousEntries?: Map<string, CollectionEntry | null | undefined>;
}

function invalidateCollection(queryClient: QueryClient) {
  // `collectionQueryKeys.all` is `['collection']` — use exact so we do not
  // also mark every ownership slice stale (that re-POSTs /quantities for the
  // visible catalog window on every +/- click).
  void queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all, exact: true });
  void queryClient.invalidateQueries({ queryKey: collectionQueryKeys.ownershipRoot });
}

/** Persist optimistic collection state without refetching the full list. */
function commitCollectionLocal(queryClient: QueryClient) {
  const entries =
    queryClient.getQueryData<CollectionEntry[]>(collectionQueryKeys.all) ?? [];
  void persistCollection(entries);
}

function reconcileCollectionEntries(
  queryClient: QueryClient,
  variantNumbers: string[],
  error: unknown
) {
  if (error) {
    // Rollback already restored cache; pull server truth once.
    invalidateCollection(queryClient);
    for (const variantNumber of variantNumbers) {
      void queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.entry(variantNumber),
      });
    }
    return;
  }

  commitCollectionLocal(queryClient);
}

function logMutationFailure(
  action: string,
  error: unknown,
  context?: Record<string, unknown>
) {
  logActionFailure(action, error, context);
}

/**
 * Snapshot + cancel without blocking the optimistic write.
 * Awaiting cancelQueries before setQueryData made Add feel ~0.5s laggy.
 */
function beginCollectionMutation(
  queryClient: QueryClient,
  variantNumber: string
): CollectionMutationContext {
  const context: CollectionMutationContext = {
    previousAll: queryClient.getQueryData<CollectionEntry[]>(collectionQueryKeys.all),
    previousEntry: queryClient.getQueryData<CollectionEntry | null>(
      collectionQueryKeys.entry(variantNumber)
    ),
  };
  void queryClient.cancelQueries({ queryKey: collectionQueryKeys.all, exact: true });
  void queryClient.cancelQueries({
    queryKey: collectionQueryKeys.entry(variantNumber),
  });
  return context;
}

function rollbackCollectionCache(
  queryClient: QueryClient,
  variantNumber: string,
  context?: CollectionMutationContext
) {
  if (!context) return;
  if (context.previousAll !== undefined) {
    queryClient.setQueryData(collectionQueryKeys.all, context.previousAll);
  }
  if (context.previousEntry !== undefined) {
    queryClient.setQueryData(
      collectionQueryKeys.entry(variantNumber),
      context.previousEntry
    );
  }
}

function applyCollectionQuantity(
  queryClient: QueryClient,
  variantNumber: string,
  quantity: number,
  seed?: CollectionEntrySeed
) {
  const now = Date.now();
  const all =
    queryClient.getQueryData<CollectionEntry[]>(collectionQueryKeys.all) ?? [];
  const index = all.findIndex((entry) => entry.variantNumber === variantNumber);

  if (quantity <= 0) {
    queryClient.setQueryData(
      collectionQueryKeys.all,
      all.filter((entry) => entry.variantNumber !== variantNumber)
    );
    queryClient.setQueryData(collectionQueryKeys.entry(variantNumber), null);
    setOwnershipQuantity(queryClient, variantNumber, 0);
    return;
  }

  if (index >= 0) {
    const updated: CollectionEntry = { ...all[index], quantity, updatedAt: now };
    const nextAll = [...all];
    nextAll[index] = updated;
    queryClient.setQueryData(collectionQueryKeys.all, nextAll);
    queryClient.setQueryData(collectionQueryKeys.entry(variantNumber), updated);
    setOwnershipQuantity(queryClient, variantNumber, quantity);
    return;
  }

  if (!seed) return;

  const created: CollectionEntry = {
    ...seed,
    variantNumber,
    quantity,
    addedAt: now,
    updatedAt: now,
  };
  queryClient.setQueryData(collectionQueryKeys.all, [created, ...all]);
  queryClient.setQueryData(collectionQueryKeys.entry(variantNumber), created);
  setOwnershipQuantity(queryClient, variantNumber, quantity);
}

function entrySeedFromListCard(
  card: CardListItem,
  variantNumber: string
): CollectionEntrySeed | null {
  const printings = getCardPrintings(card);
  const printing =
    printings.find((item) => variantNumbersMatch(item.variantNumber, variantNumber)) ??
    printings[0];
  if (!printing) return null;

  return {
    name: card.name,
    imageUrl: card.imageUrl,
    setCode: card.setCode,
    rarity: card.rarity,
    type: card.type,
    variantLabel: printing.variantLabel,
    isFoil: printing.isFoil,
  };
}

function entrySeedFromDetailCard(
  card: Parameters<typeof addDetailToCollection>[0],
  variantNumber: string
): CollectionEntrySeed | null {
  const variant = findVariantByNumber(card.variants, variantNumber);
  if (!variant) return null;

  return {
    name: card.name,
    imageUrl: variant.imageUrl,
    setCode: variant.variantNumber.split('-')[0] ?? '',
    rarity: variant.rarity,
    type: card.type,
    variantLabel: variant.variantLabel,
    isFoil: isFoilVariant(
      variant.variantNumber,
      variant.variantLabel,
      variant.variantType
    ),
  };
}

function currentQuantity(queryClient: QueryClient, variantNumber: string): number {
  const all =
    queryClient.getQueryData<CollectionEntry[]>(collectionQueryKeys.all) ?? [];
  const fromAll = all.find((entry) => entry.variantNumber === variantNumber)?.quantity;
  if (fromAll !== undefined) return fromAll;
  return getOwnershipRecord(queryClient)[variantNumber] ?? 0;
}

export function useCollectionMutations() {
  const queryClient = useQueryClient();

  const addCard = useMutation({
    mutationFn: (input: { card: CardListItem; variantNumber?: string }) =>
      addToCollection(input.card, { variantNumber: input.variantNumber }),
    onMutate: (vars) => {
      const variantNumber = vars.variantNumber ?? vars.card.variantNumber;
      const context = beginCollectionMutation(queryClient, variantNumber);
      const nextQuantity = currentQuantity(queryClient, variantNumber) + 1;
      const seed = entrySeedFromListCard(vars.card, variantNumber) ?? undefined;
      applyCollectionQuantity(queryClient, variantNumber, nextQuantity, seed);
      return context;
    },
    onError: (error, vars, context) => {
      const variantNumber = vars.variantNumber ?? vars.card.variantNumber;
      rollbackCollectionCache(queryClient, variantNumber, context);
      logMutationFailure('collection.add', error, {
        variantNumber,
        cardName: vars.card.name,
      });
    },
    onSettled: (_data, error, vars) => {
      const variantNumber = vars.variantNumber ?? vars.card.variantNumber;
      reconcileCollectionEntries(queryClient, [variantNumber], error);
    },
  });

  const addFromDetail = useMutation({
    mutationFn: (input: {
      card: Parameters<typeof addDetailToCollection>[0];
      variantNumber: string;
    }) => addDetailToCollection(input.card, input.variantNumber),
    onMutate: (vars) => {
      const context = beginCollectionMutation(queryClient, vars.variantNumber);
      const nextQuantity = currentQuantity(queryClient, vars.variantNumber) + 1;
      const seed = entrySeedFromDetailCard(vars.card, vars.variantNumber) ?? undefined;
      applyCollectionQuantity(queryClient, vars.variantNumber, nextQuantity, seed);
      return context;
    },
    onError: (error, vars, context) => {
      rollbackCollectionCache(queryClient, vars.variantNumber, context);
      logMutationFailure('collection.add_detail', error, {
        variantNumber: vars.variantNumber,
        cardName: vars.card.name,
      });
    },
    onSettled: (_data, error, vars) => {
      reconcileCollectionEntries(queryClient, [vars.variantNumber], error);
    },
  });

  const setQuantity = useMutation({
    mutationFn: ({
      variantNumber,
      quantity,
    }: {
      variantNumber: string;
      quantity: number;
    }) => updateCollectionQuantity(variantNumber, quantity),
    onMutate: (vars) => {
      const context = beginCollectionMutation(queryClient, vars.variantNumber);
      applyCollectionQuantity(queryClient, vars.variantNumber, vars.quantity);
      return context;
    },
    onError: (error, vars, context) => {
      rollbackCollectionCache(queryClient, vars.variantNumber, context);
      logMutationFailure('collection.set_quantity', error, {
        variantNumber: vars.variantNumber,
        quantity: vars.quantity,
      });
    },
    onSettled: (_data, error, vars) => {
      reconcileCollectionEntries(queryClient, [vars.variantNumber], error);
    },
  });

  const removeCard = useMutation({
    mutationFn: (variantNumber: string) => removeFromCollection(variantNumber),
    onMutate: (variantNumber) => {
      const context = beginCollectionMutation(queryClient, variantNumber);
      applyCollectionQuantity(queryClient, variantNumber, 0);
      return context;
    },
    onError: (error, variantNumber, context) => {
      rollbackCollectionCache(queryClient, variantNumber, context);
      logMutationFailure('collection.remove', error, { variantNumber });
    },
    onSettled: (_data, error, variantNumber) => {
      reconcileCollectionEntries(queryClient, [variantNumber], error);
    },
  });

  const removeMany = useMutation({
    mutationFn: (variantNumbers: string[]) => removeManyFromCollection(variantNumbers),
    onMutate: (variantNumbers) => {
      const previousAll = queryClient.getQueryData<CollectionEntry[]>(
        collectionQueryKeys.all
      );
      const previousEntries = new Map(
        variantNumbers.map((variantNumber) => [
          variantNumber,
          queryClient.getQueryData<CollectionEntry | null>(
            collectionQueryKeys.entry(variantNumber)
          ),
        ])
      );

      const removeSet = new Set(variantNumbers);
      queryClient.setQueryData(
        collectionQueryKeys.all,
        (previousAll ?? []).filter((entry) => !removeSet.has(entry.variantNumber))
      );
      for (const variantNumber of variantNumbers) {
        queryClient.setQueryData(collectionQueryKeys.entry(variantNumber), null);
        setOwnershipQuantity(queryClient, variantNumber, 0);
      }

      void queryClient.cancelQueries({ queryKey: collectionQueryKeys.all, exact: true });
      for (const variantNumber of variantNumbers) {
        void queryClient.cancelQueries({
          queryKey: collectionQueryKeys.entry(variantNumber),
        });
      }

      return { previousAll, previousEntries };
    },
    onError: (error, variantNumbers, context) => {
      if (context?.previousAll !== undefined) {
        queryClient.setQueryData(collectionQueryKeys.all, context.previousAll);
      }
      for (const variantNumber of variantNumbers) {
        const previousEntry = context?.previousEntries?.get(variantNumber);
        if (previousEntry !== undefined) {
          queryClient.setQueryData(
            collectionQueryKeys.entry(variantNumber),
            previousEntry
          );
        }
      }
      logMutationFailure('collection.remove_many', error, {
        count: variantNumbers.length,
      });
    },
    onSettled: (_data, error, variantNumbers) => {
      reconcileCollectionEntries(queryClient, variantNumbers, error);
    },
  });

  return { addCard, addFromDetail, setQuantity, removeCard, removeMany };
}

export type { CollectionEntry };
