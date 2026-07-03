import type { Router } from 'expo-router';

export type CardPresentMode = 'modal' | 'page';
export type CardOpenSource = 'catalog' | 'collection' | 'wishlist';

export function openCard(
  router: Router,
  variantNumber: string,
  present: CardPresentMode = 'modal',
  source?: CardOpenSource
) {
  const params = new URLSearchParams({ present });
  if (source) params.set('source', source);
  router.push(`/card/${encodeURIComponent(variantNumber)}?${params.toString()}`);
}

export function closeCard(router: Router) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)/search');
}
