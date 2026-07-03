import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout } from '@/constants/Layout';
import { useShowSideRail } from '@/hooks/useBreakpoint';

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const showRail = useShowSideRail();

  return {
    showRail,
    paddingTop: showRail ? 12 : insets.top + 12,
    paddingBottom: showRail ? 32 : Layout.bottomPadding,
    paddingBottomCompact: showRail ? 24 : Layout.bottomPadding,
  };
}
