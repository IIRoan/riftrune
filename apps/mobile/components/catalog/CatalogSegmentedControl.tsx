import type { LucideIcon } from '@/components/icons';
import { ThemedIcon } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  catalogToolbarGroupClass,
  catalogToolbarIconColor,
  catalogToolbarSegmentClasses,
} from '@/constants/catalogToolbar';
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
  accessibilityRole?: 'radiogroup' | 'tablist';
  segmentAccessibilityRole?: 'radio' | 'tab';
}

/** Squared segmented toolbar control — shared by view toggle and collection filter. */
export function CatalogSegmentedControl<T extends string>({
  value,
  onChange,
  options,
  mobile = false,
  iconOnly = false,
  accessibilityRole = 'radiogroup',
  segmentAccessibilityRole = 'radio',
}: CatalogSegmentedControlProps<T>) {
  return (
    <View accessibilityRole={accessibilityRole} className={catalogToolbarGroupClass(mobile)}>
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
            className={catalogToolbarSegmentClasses(active, mobile, !iconOnly)}
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
                    ? 'text-[13px] font-semibold leading-none text-foreground'
                    : 'text-[13px] font-semibold leading-none text-muted-foreground'
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
