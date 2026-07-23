import type { IconWeight } from 'phosphor-react-native';
import { useCSSVariable } from 'uniwind';
import type { AppIcon } from '@/components/icons/styled-icon';
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
  /** Phosphor weight — use `fill` for selected/active chrome. */
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
  weight = 'regular',
}: ThemedIconProps) {
  const resolved = useCSSVariable(THEME_ICON_COLOR_VARS[color]) as string | undefined;
  return <Icon size={size} color={String(resolved ?? '')} weight={weight} />;
}
