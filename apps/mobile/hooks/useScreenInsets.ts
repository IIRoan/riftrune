import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShowSideRail } from '@/hooks/useBreakpoint';
import { listBottomInset, mobileTabBarVisible } from '@/lib/mobile-chrome';

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const showRail = useShowSideRail();
  const pathname = usePathname();
  const tabBarVisible = mobileTabBarVisible(pathname, showRail);
  const mobileBottom = listBottomInset(insets.bottom, tabBarVisible);

  return {
    showRail,
    paddingTop: showRail ? 12 : insets.top + 12,
    paddingBottom: showRail ? 32 : mobileBottom,
    paddingBottomCompact: showRail ? 24 : mobileBottom,
  };
}
