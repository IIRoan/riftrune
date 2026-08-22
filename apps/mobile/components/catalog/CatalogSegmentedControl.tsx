import type { LucideIcon } from '@/components/icons';
import { ThemedIcon } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  catalogToolbarGroupClass,
  catalogToolbarIconColor,
  catalogToolbarSegmentClasses,
} from '@/constants/catalogToolbar';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

export type CatalogSegmentOption<T extends string> = {
  id: T;
  label: string;
  accessibilityLabel?: string;
  icon: LucideIcon;
};

interface CatalogSegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly CatalogSegmentOption<T>[];
  mobile?: boolean;
  iconOnly?: boolean;
  fill?: boolean;
  className?: string;
  accessibilityRole?: 'radiogroup' | 'tablist';
  segmentAccessibilityRole?: 'radio' | 'tab';
}

export function CatalogSegmentedControl<T extends string>({
  value,
  onChange,
  options,
  mobile = false,
  iconOnly = false,
  fill = false,
  className,
  accessibilityRole = 'radiogroup',
  segmentAccessibilityRole = 'radio',
}: CatalogSegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole={accessibilityRole}
      className={cn(catalogToolbarGroupClass(mobile), fill && 'w-full', className)}
    >
      {options.map((option) => {
        const active = value === option.id;
        const tone = active ? 'active' : 'inactive';
        return (
          <Pressable
            key={option.id}
            accessibilityRole={segmentAccessibilityRole}
            accessibilityState={{
              checked: segmentAccessibilityRole === 'radio' ? active : undefined,
              selected: segmentAccessibilityRole === 'tab' ? active : undefined,
            }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            onPress={() => {
              if (active) return;
              hapticPress();
              onChange(option.id);
            }}
            className={cn(
              catalogToolbarSegmentClasses(active, mobile, !iconOnly),
              fill && !iconOnly && 'min-w-0 flex-1 justify-center'
            )}
          >
            <ThemedIcon
              icon={option.icon}
              size={mobile ? 18 : 16}
              color={catalogToolbarIconColor(tone)}
            />
            {iconOnly ? null : (
              <Text
                className={
                  active
                    ? 'text-[13px] font-normal leading-none text-foreground'
                    : 'text-[13px] font-normal leading-none text-muted-foreground'
                }
                numberOfLines={1}
              >
                {option.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
