import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { cn } from '@/lib/utils';

interface DeckSectionHeaderProps {
  title: string;
  current: number;
  target: number;
  hint?: string;
  readOnly?: boolean;
  onAdd?: () => void;
  className?: string;
}

export function DeckSectionHeader({
  title,
  current,
  target,
  hint,
  readOnly = false,
  onAdd,
  className,
}: DeckSectionHeaderProps) {
  if (readOnly) {
    return (
      <View className={cn('flex-row items-baseline gap-2', className)}>
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {current}/{target}
        </Text>
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
        <View className="shrink-0 flex-row items-center gap-2">
          <Text className="font-mono text-[11px] text-muted-foreground">
            {current}/{target}
          </Text>
          {onAdd ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add cards to ${title}`}
              className="h-8 flex-row items-center gap-1 rounded-lg border border-border bg-card-panel px-2.5 active:opacity-90"
              onPress={onAdd}
            >
              <ThemedIonicon name="add" size={14} color="primary" />
              <Text className="text-[12px] font-semibold text-primary">Add</Text>
            </Pressable>
          ) : null}
        </View>
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
