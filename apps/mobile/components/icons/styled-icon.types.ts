import type { IconProps, IconWeight } from 'phosphor-react-native';

export type { IconWeight };

/** Phosphor icon props plus Uniwind `className` support. */
export type AppIconProps = IconProps & {
  className?: string;
};

export type AppIcon = React.FC<AppIconProps>;

/** @deprecated Prefer `AppIcon` — kept for existing Lucide-era imports. */
export type LucideIcon = AppIcon;
