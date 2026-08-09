import { ActivityIndicator, Pressable } from 'react-native';
import { PlusIcon, ThemedIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

/**
 * Card-detail printing-row Add control.
 * Same tinted chip language as OwnershipStepper / CollectionAddButton.
 */
export function CatalogDetailAddButton({
  name,
  busy = false,
  onPress,
  className,
}: {
  name: string;
  busy?: boolean;
  onPress: () => void;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${name} to collection`}
      disabled={busy}
      onPress={() => {
        void hapticPress();
        onPress();
      }}
      className={cn(
        'h-8 shrink-0 flex-row items-center justify-center gap-1 rounded-md bg-primary/12 px-3 web:cursor-pointer active:bg-primary/18',
        busy && 'opacity-60',
        className
      )}
    >
      {busy ? (
        <ActivityIndicator size="small" className="accent-primary" />
      ) : (
        <>
          <ThemedIcon icon={PlusIcon} size={12} color="archive-accent-text" weight="bold" />
          <Text className="text-[13px] font-semibold text-archive-accent-text">Add</Text>
        </>
      )}
    </Pressable>
  );
}
