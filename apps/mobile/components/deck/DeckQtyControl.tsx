import { ThemedIcon, MinusIcon, PlusIcon, XIcon } from '@/components/icons';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const CONTROL_HEIGHT = 'h-8';
const STEP_BTN =
  'h-full flex-1 items-center justify-center rounded-full active:bg-primary/14';

interface DeckQtyControlProps {
  count: number;
  name: string;
  single?: boolean;
  busy?: boolean;
  onMinus?: () => void;
  onPlus?: () => void;
  onRemove: () => void;
}

export function DeckQtyControl({
  count,
  name,
  single = false,
  busy = false,
  onMinus,
  onPlus,
  onRemove,
}: DeckQtyControlProps) {
  const handleMinus = () => {
    void hapticPress();
    if (single || count <= 1) {
      onRemove();
      return;
    }
    onMinus?.();
  };

  const handlePlus = () => {
    void hapticPress();
    onPlus?.();
  };

  const handleRemove = () => {
    void hapticPress();
    onRemove();
  };

  if (single) {
    return (
      <Pressable
        accessibilityLabel={`Remove ${name}`}
        className={cn(
          CONTROL_HEIGHT,
          'w-full flex-row items-center justify-center gap-1 rounded-md bg-primary/12 active:bg-destructive/10'
        )}
        onPress={handleRemove}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator size="small" className="accent-muted-foreground" />
        ) : (
          <>
            <XIcon className="size-3.5 text-destructive" />
            <Text className="text-[11px] font-medium text-destructive">Remove</Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <View
      className={cn(
        CONTROL_HEIGHT,
        'w-full flex-row items-center justify-between',
        busy && 'opacity-60'
      )}
    >
      <Pressable
        accessibilityLabel={`Decrease ${name} quantity`}
        className={STEP_BTN}
        onPress={handleMinus}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator size="small" className="accent-primary" />
        ) : (
          <ThemedIcon icon={MinusIcon} size={14} color="archive-accent-text" />
        )}
      </Pressable>
      <Text className="min-w-7 text-center font-mono text-xs font-semibold tabular-nums text-foreground">
        {count}
      </Text>
      <Pressable
        accessibilityLabel={`Increase ${name} quantity`}
        className={STEP_BTN}
        onPress={handlePlus}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator size="small" className="accent-primary" />
        ) : (
          <ThemedIcon icon={PlusIcon} size={14} color="archive-accent-text" />
        )}
      </Pressable>
    </View>
  );
}
