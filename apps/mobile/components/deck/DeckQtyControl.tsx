import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { XIcon } from '@/components/icons';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const CONTROL_HEIGHT = 'h-8';
const STEP_BTN = 'h-full flex-1 items-center justify-center active:bg-accent/80';

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
          'w-full flex-row items-center justify-center gap-1 rounded-lg border border-border bg-card-panel active:bg-destructive/10'
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
        'w-full flex-row items-stretch overflow-hidden rounded-lg border border-border bg-card-panel'
      )}
    >
      <Pressable
        accessibilityLabel={`Decrease ${name} quantity`}
        className={STEP_BTN}
        onPress={handleMinus}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator size="small" className="accent-foreground" />
        ) : (
          <ThemedIonicon name="remove" size={16} color="foreground" />
        )}
      </Pressable>
      <View className="w-hairline self-stretch bg-archive-soft-line" />
      <View className="min-w-[1.25rem] items-center justify-center px-0.5">
        <Text className="font-mono text-xs font-bold tabular-nums text-foreground">{count}</Text>
      </View>
      <View className="w-hairline self-stretch bg-archive-soft-line" />
      <Pressable
        accessibilityLabel={`Increase ${name} quantity`}
        className={STEP_BTN}
        onPress={handlePlus}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator size="small" className="accent-foreground" />
        ) : (
          <ThemedIonicon name="add" size={16} color="foreground" />
        )}
      </Pressable>
    </View>
  );
}
