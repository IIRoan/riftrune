import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from '@/components/icons';
import { ThemedIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import {
  catalogToolbarButtonClasses,
  catalogToolbarIconColor,
} from '@/constants/catalogToolbar';
import { cn } from '@/lib/utils';

interface CatalogToolbarButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
  label?: string;
  badge?: ReactNode;
  mobile?: boolean;
  className?: string;
}

/** Unified catalog toolbar icon button — sort, filter, and similar controls. */
export function CatalogToolbarButton({
  icon,
  onPress,
  accessibilityLabel,
  active = false,
  label,
  badge,
  mobile = false,
  className,
}: CatalogToolbarButtonProps) {
  const tone = active ? 'active' : 'inactive';

  if (label) {
    return (
      <Pressable
        className={cn(
          catalogToolbarButtonClasses(active, mobile, true),
          'shrink-0 flex-row gap-2',
          className
        )}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
      >
        <ThemedIcon icon={icon} size={16} color={catalogToolbarIconColor(tone)} />
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        {badge}
      </Pressable>
    );
  }

  return (
    <Pressable
      className={cn(
        catalogToolbarButtonClasses(active, mobile),
        'relative',
        mobile ? 'w-full' : 'shrink-0',
        className
      )}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <ThemedIcon icon={icon} size={18} color={catalogToolbarIconColor(tone)} />
      {badge}
    </Pressable>
  );
}

/** Primary-colored dot shown when a filter is active. */
export function CatalogToolbarBadgeDot() {
  return <View className="absolute right-2 top-2 size-2 rounded-full bg-primary" />;
}
