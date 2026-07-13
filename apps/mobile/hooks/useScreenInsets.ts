import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBarContentInset } from '@/constants/Layout';
import { useShowSideRail } from '@/hooks/useBreakpoint';

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const showRail = useShowSideRail();
  const mobileBottom = tabBarContentInset(insets.bottom);

  return {
    showRail,
    paddingTop: showRail ? 12 : insets.top + 12,
    paddingBottom: showRail ? 32 : mobileBottom,
    paddingBottomCompact: showRail ? 24 : mobileBottom,
  };
}
