import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export function CatalogDetailStat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="min-h-[44px] flex-1 items-center justify-center gap-0.5 px-1 py-2">
      <Text className="text-[11px] font-medium text-muted-foreground">{label}</Text>
      {children}
    </View>
  );
}

export function CatalogDetailMetaPill({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="min-w-[42%] flex-1">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      </View>
      <View className="mt-1">{children}</View>
    </View>
  );
}
