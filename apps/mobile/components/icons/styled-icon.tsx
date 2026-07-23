import type { Icon, IconProps, IconWeight } from 'phosphor-react-native';
import Svg from 'react-native-svg';
import { withUniwind } from 'uniwind';
import { cn } from '@/lib/utils';

export type { IconWeight };

/** Phosphor icon props plus Uniwind `className` support. */
export type AppIconProps = IconProps & {
  className?: string;
};

export type AppIcon = React.FC<AppIconProps>;

/** @deprecated Prefer `AppIcon` — kept for existing Lucide-era imports. */
export type LucideIcon = AppIcon;

const DEFAULT_WEIGHT: IconWeight = 'regular';

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
 */
export const createStyledSvg = (Icon: Icon): AppIcon => {
  const UniwindBridge = withUniwind(
    ({ color, style, size, weight = DEFAULT_WEIGHT, ...rest }: AppIconProps) => {
      const styleColor =
        style && typeof style === 'object' && !Array.isArray(style) && 'color' in style
          ? (style as { color?: string }).color
          : undefined;
      return (
        <Icon
          color={color ?? styleColor}
          size={size}
          weight={weight}
          style={style}
          {...rest}
        />
      );
    },
    styledSvgOptionMapping
  );

  const StyledIcon = ({ className, weight = DEFAULT_WEIGHT, ...props }: AppIconProps) => {
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
