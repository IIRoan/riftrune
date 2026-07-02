import { useLocalSearchParams, useRouter } from 'expo-router';
import type { CardPresentMode } from '@/utils/cardNavigation';

export function useCardPresentation(): CardPresentMode {
  const { present } = useLocalSearchParams<{ present?: string | string[] }>();
  const router = useRouter();

  const mode = Array.isArray(present) ? present[0] : present;
  if (mode === 'page') return 'page';
  if (mode === 'modal') return 'modal';
  return router.canGoBack() ? 'modal' : 'page';
}
