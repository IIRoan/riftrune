import { ThemedIcon, MinusIcon, PlusIcon } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

/** Tray footer height — matches `GridCollectionControl`. */
const CONTROL_HEIGHT = 'h-9';
const ICON_SIZE = 14;

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

/** Deck control for tray tiles — mirrors `GridCollectionControl`. */
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
      <View className={`${CONTROL_HEIGHT} w-full flex-row items-center justify-center`}>
        <Text className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
          ×{count}
        </Text>
      </View>
    );
  }

  if (count === 0) {
    if (blocked) {
      return (
        <View
          className={`${CONTROL_HEIGHT} w-full items-center justify-center rounded-full border border-border/70 bg-card px-2`}
        >
          <Text
            className="text-center text-[11px] font-medium text-muted-foreground"
            numberOfLines={1}
          >
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
          CONTROL_HEIGHT,
          'w-full flex-row items-center justify-center gap-1.5 rounded-full border border-border bg-card active:opacity-80',
          !canAdd && 'opacity-45'
        )}
        disabled={!canAdd}
        onPress={handleAdd}
      >
        <ThemedIcon icon={PlusIcon} size={ICON_SIZE} color="foreground" />
        <Text className="text-[13px] font-semibold text-foreground">Add</Text>
      </Pressable>
    );
  }

  return (
    <View
      className={cn(
        CONTROL_HEIGHT,
        'w-full flex-row items-center justify-between rounded-full bg-background/80 px-0.5'
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove one ${name}`}
        hitSlop={6}
        className={cn(
          'size-8 items-center justify-center rounded-full active:bg-foreground/8',
          !canRemove && 'opacity-40'
        )}
        disabled={!canRemove}
        onPress={handleRemove}
      >
        <ThemedIcon icon={MinusIcon} size={ICON_SIZE} color="foreground" />
      </Pressable>
      <Text className="min-w-6 text-center font-mono text-[13px] font-semibold tabular-nums text-foreground">
        {count}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add one ${name}`}
        hitSlop={6}
        className={cn(
          'size-8 items-center justify-center rounded-full active:bg-foreground/8',
          !canAdd && 'opacity-40'
        )}
        disabled={!canAdd}
        onPress={handleAdd}
      >
        <ThemedIcon
          icon={PlusIcon}
          size={ICON_SIZE}
          color={canAdd ? 'foreground' : 'muted-foreground'}
        />
      </Pressable>
    </View>
  );
}
