import { LightningIcon, ThemedIcon } from '@/components/icons';
import { Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

interface CatalogSimpleAddToggleProps {
  active: boolean;
  onChange: (active: boolean) => void;
  className?: string;
}

/**
 * Toolbar preference next to All/Owned — skips foil picker on quick-add
 * and inserts the standard finish.
 */
export function CatalogSimpleAddToggle({
  active,
  onChange,
  className,
}: CatalogSimpleAddToggleProps) {
  const isMobile = useMobileLayout();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      accessibilityLabel="Simple add"
      accessibilityHint="Skip foil choice and add the standard printing"
      onPress={() => {
        void hapticPress();
        onChange(!active);
      }}
      className={cn(
        'shrink-0 flex-row items-center justify-center gap-1.5 rounded-xl border active:opacity-80',
        isMobile ? 'size-11 px-0' : 'h-9 px-2.5',
        active ? 'border-ring/50 bg-card-panel' : 'border-border bg-card',
        className
      )}
    >
      <ThemedIcon
        icon={LightningIcon}
        size={isMobile ? 18 : 15}
        color={active ? 'primary' : 'muted-foreground'}
      />
      {isMobile ? null : (
        <Text
          className={cn(
            'text-[11px] font-semibold leading-none',
            active ? 'text-primary' : 'text-muted-foreground'
          )}
          numberOfLines={1}
        >
          Simple
        </Text>
      )}
    </Pressable>
  );
}
