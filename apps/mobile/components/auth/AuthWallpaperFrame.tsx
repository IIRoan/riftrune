import { View } from 'react-native';
import { AuthBackdrop } from '@/components/auth/AuthBackdrop';
import type { Mode } from '@/components/auth/auth-types';
import { cn } from '@/lib/utils';

type AuthWallpaperFrameProps = {
  mode: Mode;
  className?: string;
};

/** Wallpaper clipped to a soft rounded frame (reference-style art panel). */
export function AuthWallpaperFrame({ mode, className }: AuthWallpaperFrameProps) {
  return (
    <View className={cn('relative min-h-0 overflow-hidden rounded-3xl', className)}>
      <AuthBackdrop mode={mode} variant="contained" />
    </View>
  );
}
