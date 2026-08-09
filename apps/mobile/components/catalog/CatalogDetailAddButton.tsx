import { ActivityIndicator, Pressable } from 'react-native';
import { PlusIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { OPERATE_CTA_LABEL_CLASS } from '@/constants/operateType';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

/**
 * Card-detail printing-row Add — Factory chalk CTA (flashlit dispatch on dark).
 * See apps/mobile/DESIGN.md → Catalog detail actions.
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
        'h-8 shrink-0 flex-row items-center justify-center gap-1 rounded-[3px] bg-foreground px-3.5 web:cursor-pointer active:opacity-80',
        busy && 'opacity-60',
        className
      )}
    >
      {busy ? (
        <ActivityIndicator size="small" className="accent-background" />
      ) : (
        <>
          <PlusIcon className="size-3.5 text-background" weight="bold" />
          <Text className={OPERATE_CTA_LABEL_CLASS}>Add</Text>
        </>
      )}
    </Pressable>
  );
}
