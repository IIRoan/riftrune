import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getOwnershipRecord } from '@/hooks/useCollection';
import { collectionQueryKeys } from '@/src/api/queryKeys';
import {
  ownershipMapFromRecord,
  type CollectionOwnershipMap,
} from '@/utils/collectionOwnership';

const OWNERSHIP_STALE_MS = 5 * 60 * 1000;
const EMPTY_MAP: CollectionOwnershipMap = new Map();

/** Shared ownership map for list tiles — avoids passing new props through FlatList. */
export function useOwnershipMap(): CollectionOwnershipMap {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: collectionQueryKeys.ownershipRoot,
    queryFn: () => getOwnershipRecord(queryClient),
    initialData: () => getOwnershipRecord(queryClient),
    staleTime: OWNERSHIP_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return useMemo(
    () => (data ? ownershipMapFromRecord(data) : EMPTY_MAP),
    [data]
  );
}
