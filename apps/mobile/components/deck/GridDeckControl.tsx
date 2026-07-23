import { ThemedIcon, MinusIcon, PlusIcon } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

/** Fixed footer height — matches `GridCollectionControl` to avoid grid layout shift. */
const CONTROL_HEIGHT = 'h-6';
const ICON_SIZE = 9;

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
      <View className={`${CONTROL_HEIGHT} w-full flex-row items-center justify-center`}>
        <Text className="font-mono text-xs font-semibold tabular-nums text-foreground">
          ×{count}
        </Text>
      </View>
    );
  }

  if (count === 0) {
    if (blocked) {
      return (
        <View
          className={`${CONTROL_HEIGHT} w-full items-center justify-center rounded-md bg-card-panel px-1`}
        >
          <Text
            className="text-center text-[10px] font-medium text-muted-foreground"
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
          'w-full flex-row items-center justify-center gap-1 rounded-md bg-primary/12 px-1.5 active:bg-primary/18',
          !canAdd && 'opacity-45'
        )}
        disabled={!canAdd}
        onPress={handleAdd}
      >
        <ThemedIcon
          icon={PlusIcon}
          size={ICON_SIZE}
          color="archive-accent-text"
          weight="regular"
        />
        <Text className="text-[11px] font-semibold text-archive-accent-text">Add</Text>
      </Pressable>
    );
  }

  const stepBtn =
    'h-full flex-1 items-center justify-center rounded-full active:bg-primary/14';

  return (
    <View className={cn(CONTROL_HEIGHT, 'w-full flex-row items-center justify-between')}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove one ${name}`}
        className={cn(stepBtn, !canRemove && 'opacity-40')}
        disabled={!canRemove}
        onPress={handleRemove}
      >
        <ThemedIcon
          icon={MinusIcon}
          size={ICON_SIZE}
          color="archive-accent-text"
          weight="regular"
        />
      </Pressable>
      <Text className="min-w-7 text-center font-mono text-xs font-semibold tabular-nums text-foreground">
        {count}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add one ${name}`}
        className={cn(stepBtn, !canAdd && 'opacity-40')}
        disabled={!canAdd}
        onPress={handleAdd}
      >
        <ThemedIcon
          icon={PlusIcon}
          size={ICON_SIZE}
          color={canAdd ? 'archive-accent-text' : 'muted-foreground'}
          weight="regular"
        />
      </Pressable>
    </View>
  );
}
