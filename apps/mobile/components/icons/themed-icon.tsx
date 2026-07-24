import type { IconWeight } from 'phosphor-react-native';
import { useCSSVariable } from 'uniwind';
import type { AppIcon } from '@/components/icons/styled-icon';
import { appIconWeightForSize, iconPixelSize } from '@/lib/iconDefaults';
import {
  THEME_ICON_COLOR_VARS,
  type ThemedIconColor,
} from '@/lib/themeIconTokens';

export type { ThemedIconColor } from '@/lib/themeIconTokens';
export { THEME_ICON_COLOR_VARS, themeIconColorVar } from '@/lib/themeIconTokens';

export type ThemedIconProps = {
  icon: AppIcon;
  size: number;
  color?: ThemedIconColor;
  /** Phosphor weight — omit for size-aware default; use `fill` for selected/active. */
  weight?: IconWeight;
};

/**
 * Phosphor icon tinted with a Uniwind theme token.
 * Prefer className on styled icons when color is static; use this when the
 * token must resolve at runtime (tab bars, toolbars, active states).
 */
export function ThemedIcon({
  icon: Icon,
  size,
  color = 'muted-foreground',
  weight,
}: ThemedIconProps) {
  const resolved = useCSSVariable(THEME_ICON_COLOR_VARS[color]) as string | undefined;
  const pixelSize = iconPixelSize(size);
  return (
    <Icon
      size={pixelSize}
      color={String(resolved ?? '')}
      weight={weight ?? appIconWeightForSize(pixelSize)}
    />
  );
}
