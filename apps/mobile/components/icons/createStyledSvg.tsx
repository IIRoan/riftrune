import type { Icon } from 'phosphor-react-native';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { withUniwind } from 'uniwind';
import {
  appIconWeightForSize,
  iconPixelSize,
  iconSizeFromStyle,
  iconStyleWithoutBoxSize,
} from '@/lib/iconDefaults';
import { cn } from '@/lib/utils';
import type { AppIcon, AppIconProps } from '@/components/icons/styled-icon.types';

const WEB_ICON_STYLE: ViewStyle | null =
  Platform.OS === 'web'
    ? {
        overflow: 'visible',
      }
    : null;

function mergeIconStyle(style: StyleProp<ViewStyle> | undefined): StyleProp<ViewStyle> {
  const cleaned = iconStyleWithoutBoxSize(style);
  if (!WEB_ICON_STYLE) return cleaned;
  return cleaned ? [WEB_ICON_STYLE, cleaned] : WEB_ICON_STYLE;
}

const styledSvgOptionMapping = {
  style: {
    fromClassName: 'className',
  },
  height: {
    fromClassName: 'className',
    styleProperty: 'height',
  },
  width: {
    fromClassName: 'className',
    styleProperty: 'width',
  },
  color: {
    fromClassName: 'className',
    styleProperty: 'color',
  },
} as const;

/** Pass resolved className size to Phosphor — CSS-scaling 24→14px mushifies Firefox icons. */
export const createStyledSvg = (Icon: Icon): AppIcon => {
  const UniwindBridge = withUniwind(
    ({ color, style, size, weight, ...rest }: AppIconProps) => {
      const styleColor =
        style && typeof style === 'object' && !Array.isArray(style) && 'color' in style
          ? (style as { color?: string }).color
          : undefined;
      const resolvedSize = iconPixelSize(
        typeof size === 'number' ? size : iconSizeFromStyle(style)
      );
      const resolvedWeight = weight ?? appIconWeightForSize(resolvedSize);
      return (
        <Icon
          color={color ?? styleColor}
          size={resolvedSize}
          weight={resolvedWeight}
          style={mergeIconStyle(style)}
          {...rest}
        />
      );
    },
    styledSvgOptionMapping
  );

  const StyledIcon = ({ className, weight, ...props }: AppIconProps) => {
    return (
      <UniwindBridge
        className={cn('size-6 text-foreground', className)}
        weight={weight}
        {...props}
      />
    );
  };

  return StyledIcon;
};
