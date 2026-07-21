import { View } from 'react-native';
import { AuthBackdrop } from '@/components/auth/AuthBackdrop';
import type { Mode } from '@/components/auth/auth-types';
import { cn } from '@/lib/utils';

type AuthWallpaperFrameProps = {
  mode: Mode;
  className?: string;
};

/** Framed “single card” art for wide auth — not a full-bleed hero. */
export function AuthWallpaperFrame({ mode, className }: AuthWallpaperFrameProps) {
  return (
    <View
      className={cn(
        'relative min-h-0 overflow-hidden rounded-xl border border-border bg-card',
        className
      )}
    >
      <AuthBackdrop mode={mode} variant="contained" />
    </View>
  );
}
