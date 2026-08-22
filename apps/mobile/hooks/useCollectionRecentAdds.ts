import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchRemoteCollectionRecentAdds } from '@/services/remoteCollectionService';
import { collectionQueryKeys } from '@/src/api/queryKeys';
import { authClient } from '@/src/lib/auth-client';

export function useCollectionRecentAdds(
  variantNumbers: readonly string[],
  enabled = true
) {
  const sessionQuery = authClient.useSession();
  const signedIn = Boolean(sessionQuery.data?.user);
  const unique = useMemo(
    () => [...new Set(variantNumbers.filter(Boolean))].sort(),
    [variantNumbers]
  );

  const query = useQuery({
    queryKey: collectionQueryKeys.recentAdds(unique),
    queryFn: () => fetchRemoteCollectionRecentAdds(unique),
    enabled: enabled && signedIn && unique.length > 0,
    staleTime: 30_000,
  });

  return { events: query.data ?? [], isLoading: query.isLoading };
}
