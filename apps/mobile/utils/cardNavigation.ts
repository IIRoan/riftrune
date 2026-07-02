import type { Router } from 'expo-router';

export type CardPresentMode = 'modal' | 'page';

export function openCard(
  router: Router,
  variantNumber: string,
  present: CardPresentMode = 'modal'
) {
  router.push(`/card/${encodeURIComponent(variantNumber)}?present=${present}`);
}

export function closeCard(router: Router) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)/search');
}
