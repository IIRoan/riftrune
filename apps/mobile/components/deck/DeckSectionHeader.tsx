import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface DeckSectionHeaderProps {
  title: string;
  current: number;
  target: number;
  hint?: string;
  readOnly?: boolean;
  className?: string;
}

export function DeckSectionHeader({
  title,
  current,
  target,
  hint,
  readOnly = false,
  className,
}: DeckSectionHeaderProps) {
  if (readOnly) {
    return (
      <View className={className}>
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
      </View>
    );
  }

  const ratio = target > 0 ? Math.min(1, current / target) : 0;
  const complete = current >= target;
  const remaining = Math.max(0, target - current);

  return (
    <View className={cn('gap-2', className)}>
      <View className="flex-row items-end justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-baseline gap-2">
          <Text
            className={cn(
              'font-mono text-xl font-bold tabular-nums leading-none',
              complete ? 'text-success' : 'text-primary'
            )}
          >
            {current}
          </Text>
          <Text className="text-sm font-semibold text-foreground">{title}</Text>
        </View>
        <Text className="shrink-0 font-mono text-[11px] text-muted-foreground">
          {current}/{target}
        </Text>
      </View>

      <View className="h-1 overflow-hidden rounded-full bg-border/80">
        <View
          className={cn('h-full rounded-full', complete ? 'bg-success' : 'bg-primary')}
          style={{ width: `${Math.max(ratio * 100, current > 0 ? 4 : 0)}%` }}
        />
      </View>

      {hint ? (
        <Text className="font-mono text-[11px] text-muted-foreground">{hint}</Text>
      ) : remaining > 0 ? (
        <Text className="font-mono text-[11px] text-muted-foreground">
          {remaining} card{remaining === 1 ? '' : 's'} remaining
        </Text>
      ) : complete ? (
        <Text className="font-mono text-[11px] text-success">Section complete</Text>
      ) : null}
    </View>
  );
}
