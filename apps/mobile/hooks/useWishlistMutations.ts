import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  addToWishlist,
  removeFromWishlist,
  type WishlistEntry,
} from '@/services/wishlistService';
import { wishlistQueryKeys } from '@/src/api/queryKeys';

export function useWishlistMutations() {
  const queryClient = useQueryClient();

  const invalidateWishlist = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.all });
  }, [queryClient]);

  const add = useMutation({
    mutationFn: (
      entry: Pick<WishlistEntry, 'variantNumber' | 'name'> &
        Partial<Pick<WishlistEntry, 'imageUrl' | 'targetPriceCents'>>
    ) => addToWishlist(entry),
    onSuccess: invalidateWishlist,
  });

  const remove = useMutation({
    mutationFn: (variantNumber: string) => removeFromWishlist(variantNumber),
    onSuccess: invalidateWishlist,
  });

  return { add, remove };
}
