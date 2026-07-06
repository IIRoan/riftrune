import { Image } from 'expo-image';
import type { QueryClient } from '@tanstack/react-query';
import type { CardListItem } from '@riftbound/contracts';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

const DETAIL_STALE_MS = 5 * 60 * 1000;

/** Warm the detail query and image cache for a catalog list row. */
export function prefetchCardDetail(queryClient: QueryClient, item: CardListItem): void {
  const { variantNumber } = item;
  const imageUri = resolveImageUrl(item.imageUrl);
  if (imageUri) {
    void Image.prefetch(imageUri);
  }

  void queryClient.prefetchQuery({
    queryKey: cardQueryKeys.detail(variantNumber),
    queryFn: () => api.getCard(variantNumber),
    staleTime: DETAIL_STALE_MS,
  });
}
