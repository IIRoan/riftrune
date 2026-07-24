import type { Icon, IconProps, IconWeight } from 'phosphor-react-native';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import Svg from 'react-native-svg';
import { withUniwind } from 'uniwind';
import {
  APP_ICON_WEIGHT,
  appIconWeightForSize,
  iconPixelSize,
  iconSizeFromStyle,
  iconStyleWithoutBoxSize,
} from '@/lib/iconDefaults';
import { cn } from '@/lib/utils';

export type { IconWeight };

/** Phosphor icon props plus Uniwind `className` support. */
export type AppIconProps = IconProps & {
  className?: string;
};

export type AppIcon = React.FC<AppIconProps>;

/** @deprecated Prefer `AppIcon` — kept for existing Lucide-era imports. */
export type LucideIcon = AppIcon;

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

export const StyledSvg = withUniwind(Svg, styledSvgOptionMapping);

/**
 * Wrap a Phosphor icon so Uniwind `className` can drive size + color.
 * Phosphor paints via the `color` prop (not CSS currentColor alone).
 *
 * Important: resolve `size` from className box metrics and pass that to Phosphor.
 * Scaling a 24px SVG down to 14px via CSS is what made Firefox icons look mushy.
 */
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

export { APP_ICON_WEIGHT };
