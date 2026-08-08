import { LightningIcon, ThemedIcon } from '@/components/icons';
import { Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  catalogToolbarButtonClasses,
  catalogToolbarIconColor,
} from '@/constants/catalogToolbar';
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
  const tone = active ? 'active' : 'inactive';

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      accessibilityLabel="Quick add"
      accessibilityHint="Skip foil choice and add the standard printing"
      onPress={() => {
        void hapticPress();
        onChange(!active);
      }}
      className={cn(
        catalogToolbarButtonClasses(active, isMobile, !isMobile),
        isMobile && 'w-11 px-0',
        className
      )}
    >
      <ThemedIcon
        icon={LightningIcon}
        size={isMobile ? 18 : 16}
        color={catalogToolbarIconColor(tone)}
      />
      {isMobile ? null : (
        <Text
          className={cn(
            'text-[13px] font-semibold leading-none',
            active ? 'text-foreground' : 'text-muted-foreground'
          )}
          numberOfLines={1}
        >
          Quick add
        </Text>
      )}
    </Pressable>
  );
}
