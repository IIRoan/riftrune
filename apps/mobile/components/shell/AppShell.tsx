import { View } from 'react-native';
import { useShowSideRail } from '@/hooks/useBreakpoint';
import { SideRail } from './SideRail';

export function AppShell({ children }: { children: React.ReactNode }) {
  const showRail = useShowSideRail();

  if (!showRail) {
    return <View className="flex-1 bg-background">{children}</View>;
  }

  return (
    <View className="min-h-0 flex-1 flex-row bg-background web:h-screen web:max-h-screen">
      <SideRail />
      <View className="min-h-0 min-w-0 flex-1">{children}</View>
    </View>
  );
}
