import { ActivityIndicator, View } from 'react-native';
import { Badge, BadgeIcon, BadgeText } from '@/components/ui/badge';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Chip, ChipText } from '@/components/ui/chip';
import { Separator } from '@/components/ui/separator';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

interface Props {
  quantity: number;
  isFoil?: boolean;
  compact?: boolean;
  loading?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CollectionAddButton({
  onPress,
  disabled,
  loading,
  className,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 w-auto shrink-0 px-2.5', className)}
      onPress={onPress}
      disabled={disabled}
      busy={loading}
      accessibilityLabel="Add to collection"
    >
      <ButtonText className="text-[13px] font-semibold text-foreground">Add</ButtonText>
    </Button>
  );
}

export function CollectionQtyControls({
  quantity,
  isFoil = false,
  compact = false,
  loading = false,
  onIncrement,
  onDecrement,
  onRemove,
}: Props) {
  const displayQuantity = Math.max(0, quantity);

  const handleDecrement = () => {
    void hapticPress();
    if (displayQuantity <= 1) {
      onRemove();
      return;
    }
    onDecrement();
  };

  const handleRemove = () => {
    void hapticPress();
    onRemove();
  };

  if (compact) {
    return (
      <View className="flex-row items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-md"
          onPress={handleDecrement}
          disabled={loading}
          accessibilityLabel="Decrease quantity"
        >
          <ButtonIcon className="size-4">
            <ThemedIonicon name="remove" size={16} color="foreground" />
          </ButtonIcon>
        </Button>
        <Text className="min-w-6 text-center text-[13px] font-bold tabular-nums text-foreground">
          {displayQuantity}
        </Text>
        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-md"
          onPress={() => {
            void hapticPress();
            onIncrement();
          }}
          disabled={loading}
          accessibilityLabel="Increase quantity"
        >
          <ButtonIcon className="size-4">
            <ThemedIonicon name="add" size={16} color="foreground" />
          </ButtonIcon>
        </Button>
      </View>
    );
  }

  return (
    <Stack className="gap-3.5 pt-1">
      <Stack direction="row" className="items-center justify-center gap-2.5">
        <Badge variant="outline" className="border-ring/30 bg-primary/5">
          <BadgeIcon>
            <ThemedIonicon name="checkmark-circle" size={14} color="ring" />
          </BadgeIcon>
          <BadgeText className="text-[11px] font-bold uppercase tracking-widest text-ring">
            In collection
          </BadgeText>
        </Badge>
        {isFoil ? (
          <Chip variant="outline" className="pointer-events-none">
            <ChipText className="text-[10px] uppercase tracking-wide">Foil</ChipText>
          </Chip>
        ) : null}
      </Stack>

      <View className="flex-row items-center justify-center gap-4 py-1">
        <Button
          size="icon"
          variant="outline"
          className="size-11 rounded-md"
          onPress={handleDecrement}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" className="accent-primary" />
          ) : (
            <ButtonIcon className="size-5">
              <ThemedIonicon name="remove" size={20} color="foreground" />
            </ButtonIcon>
          )}
        </Button>

        <Stack className="min-w-12 items-center">
          <Text className="text-[28px] font-extrabold tabular-nums text-foreground">
            {displayQuantity}
          </Text>
          <Text className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            owned
          </Text>
        </Stack>

        <Button
          size="icon"
          variant="outline"
          className="size-11 rounded-md"
          onPress={() => {
            void hapticPress();
            onIncrement();
          }}
          disabled={loading}
        >
          <ButtonIcon className="size-5">
            <ThemedIonicon name="add" size={20} color="foreground" />
          </ButtonIcon>
        </Button>
      </View>

      <Separator />
      <Button variant="ghost" onPress={handleRemove} disabled={loading}>
        <ButtonIcon>
          <ThemedIonicon name="trash-outline" size={15} color="muted-foreground" />
        </ButtonIcon>
        <ButtonText className="text-muted-foreground">Remove from collection</ButtonText>
      </Button>
    </Stack>
  );
}
