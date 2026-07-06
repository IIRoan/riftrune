import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import {
  THEME_ICON_COLOR_VARS,
  type ThemedIconColor,
} from '@/lib/themeIconTokens';

export type { ThemedIconColor } from '@/lib/themeIconTokens';
export { THEME_ICON_COLOR_VARS, themeIconColorVar } from '@/lib/themeIconTokens';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  size: number;
  color?: ThemedIconColor;
};

/** Ionicons do not inherit Uniwind `className` colors — pass resolved theme tokens instead. */
export function ThemedIonicon({ name, size, color = 'muted-foreground' }: Props) {
  const resolved = useCSSVariable(THEME_ICON_COLOR_VARS[color]) as string | undefined;
  return <Ionicons name={name} size={size} color={String(resolved ?? '')} />;
}
