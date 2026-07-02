import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

interface DetailRowProps {
  label: string;
  value?: string | number | null;
  children?: ReactNode;
  className?: string;
}

export function DetailRow({ label, value, children, className }: DetailRowProps) {
  return (
    <View className={cn('mb-2.5 flex-row items-start justify-between gap-4', className)}>
      <Text className="shrink-0 text-sm text-muted-foreground">{label}</Text>
      {children ?? (
        <Text className="flex-1 text-right text-sm font-semibold text-foreground">
          {value != null && value !== '' ? String(value) : '—'}
        </Text>
      )}
    </View>
  );
}
