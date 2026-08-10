import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { APP_FONTS } from '@/lib/app-fonts';
import { ensureWebFontFaces } from '@/lib/web-font-faces';

export function useAppFonts(): boolean {
  const [loaded] = useFonts(APP_FONTS);

  useEffect(() => {
    if (!loaded || Platform.OS !== 'web') return;
    ensureWebFontFaces();
  }, [loaded]);

  return loaded;
}
