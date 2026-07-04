import { useState, type ReactElement } from 'react';
import { Platform, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const TOOLBAR_BUTTON_SIZE = 32;
const TOOLBAR_ICON_SIZE = 18;

export const toolbarButtonSize = TOOLBAR_BUTTON_SIZE;
export const toolbarIconSize = TOOLBAR_ICON_SIZE;

type HoverTooltipProps = {
  label: string;
  children: ReactElement;
  className?: string;
};

/** Web-only hover label; passes children through unchanged on native. */
export function HoverTooltip({ label, children, className }: HoverTooltipProps) {
  const [visible, setVisible] = useState(false);

  if (Platform.OS !== 'web') {
    return children;
  }

  return (
    <View
      className={cn('relative', className)}
      // RN Web mouse hooks for tooltip visibility
      {...({
        onMouseEnter: () => {
          setVisible(true);
        },
        onMouseLeave: () => {
          setVisible(false);
        },
      } as object)}
    >
      {children}
      {visible ? (
        <View
          pointerEvents="none"
          className="absolute bottom-full left-0 right-0 mb-1.5 items-center"
        >
          <View className="rounded-md bg-popover px-2 py-1">
            <Text className="whitespace-nowrap text-xs font-medium text-popover-foreground">
              {label}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Fixed square slot for toolbar glyphs so icons and spinners share the same box. */
export function ToolbarIconSlot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn('items-center justify-center overflow-hidden', className)}
      style={{ width: TOOLBAR_ICON_SIZE, height: TOOLBAR_ICON_SIZE }}
    >
      {children}
    </View>
  );
}
