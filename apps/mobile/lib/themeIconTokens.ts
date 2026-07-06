export type ThemedIconColor =
  | 'foreground'
  | 'muted-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'ring'
  | 'archive-accent-text';

export const THEME_ICON_COLOR_VARS: Record<ThemedIconColor, string> = {
  foreground: '--color-foreground',
  'muted-foreground': '--color-muted-foreground',
  primary: '--color-primary',
  'primary-foreground': '--color-primary-foreground',
  ring: '--color-ring',
  'archive-accent-text': '--color-archive-accent-text',
};

/** Resolve the Uniwind CSS variable name for a themed icon color token. */
export function themeIconColorVar(color: ThemedIconColor): string {
  return THEME_ICON_COLOR_VARS[color];
}
