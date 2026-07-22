import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

/** Fixed footer height — matches `GridCollectionControl` to avoid grid layout shift. */
const CONTROL_HEIGHT = 'h-8';

interface GridDeckControlProps {
  count: number;
  name: string;
  canAdd: boolean;
  canRemove: boolean;
  blocked?: boolean;
  blockedLabel?: string;
  readOnly?: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

/** Compact deck control for catalog grid tiles — mirrors `GridCollectionControl`. */
export function GridDeckControl({
  count,
  name,
  canAdd,
  canRemove,
  blocked = false,
  blockedLabel = 'Unavailable',
  readOnly = false,
  onAdd,
  onRemove,
}: GridDeckControlProps) {
  const handleAdd = () => {
    void hapticPress();
    onAdd();
  };

  const handleRemove = () => {
    void hapticPress();
    onRemove();
  };

  if (readOnly) {
    if (count === 0) return null;
    return (
      <View
        className={`${CONTROL_HEIGHT} w-full flex-row items-center justify-center rounded-md border border-border bg-card-panel`}
      >
        <Text className="font-mono text-xs font-bold tabular-nums text-foreground">×{count}</Text>
      </View>
    );
  }

  if (count === 0) {
    if (blocked) {
      return (
        <View
          className={`${CONTROL_HEIGHT} w-full items-center justify-center rounded-md border border-border bg-card px-1`}
        >
          <Text className="text-center text-[10px] font-medium text-muted-foreground" numberOfLines={1}>
            {blockedLabel}
          </Text>
        </View>
      );
    }

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${name} to deck`}
        accessibilityState={{ disabled: !canAdd }}
        className={cn(
          `${CONTROL_HEIGHT} w-full flex-row items-center justify-center gap-0.5 rounded-md border border-border bg-card active:bg-card-panel`,
          !canAdd && 'opacity-45'
        )}
        disabled={!canAdd}
        onPress={handleAdd}
      >
        <ThemedIonicon name="add" size={14} color="muted-foreground" />
        <Text className="text-[10px] font-medium text-muted-foreground">Add</Text>
      </Pressable>
    );
  }

  const stepBtn = 'h-full flex-1 items-center justify-center active:bg-accent/80';

  return (
    <View
      className={`${CONTROL_HEIGHT} w-full flex-row items-stretch overflow-hidden rounded-lg border border-border bg-card-panel`}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove one ${name}`}
        className={stepBtn}
        disabled={!canRemove}
        onPress={handleRemove}
      >
        <ThemedIonicon name="remove" size={16} color="foreground" />
      </Pressable>
      <View className="w-hairline self-stretch bg-archive-soft-line" />
      <View className="min-w-[1.25rem] items-center justify-center px-0.5">
        <Text className="font-mono text-xs font-bold tabular-nums text-primary">×{count}</Text>
      </View>
      <View className="w-hairline self-stretch bg-archive-soft-line" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add one ${name}`}
        className={cn(stepBtn, !canAdd && 'opacity-40')}
        disabled={!canAdd}
        onPress={handleAdd}
      >
        <ThemedIonicon name="add" size={16} color={canAdd ? 'foreground' : 'muted-foreground'} />
      </Pressable>
    </View>
  );
}
