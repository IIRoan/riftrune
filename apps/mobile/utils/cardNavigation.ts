import type { Router } from 'expo-router';

export type CardPresentMode = 'modal' | 'page';
export type CardOpenSource = 'catalog' | 'collection' | 'wishlist' | 'deck-view';

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

export function parseCardOpenSource(
  value: string | string[] | undefined
): CardOpenSource {
  const source = Array.isArray(value) ? value[0] : value;
  if (source === 'wishlist' || source === 'collection' || source === 'deck-view') {
    return source;
  }
  return 'catalog';
}

export function closeCard(router: Router) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)/search');
}
