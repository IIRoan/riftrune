import { useQuery } from '@tanstack/react-query';
import { getWishlist } from '@/services/wishlistService';
import { wishlistQueryKeys } from '@/src/api/queryKeys';

export function useWishlist() {
  return useQuery({
    queryKey: wishlistQueryKeys.all,
    queryFn: getWishlist,
    staleTime: 60_000,
  });
}
