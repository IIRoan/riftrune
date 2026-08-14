import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { APP_FONTS } from '@/lib/app-fonts';
import { ensureWebFontFaces, waitForWebFontFaces } from '@/lib/web-font-faces';

export function useAppFonts(): boolean {
  const [loaded] = useFonts(APP_FONTS);
  const [webFacesReady, setWebFacesReady] = useState(Platform.OS !== 'web');

  if (Platform.OS === 'web') {
    ensureWebFontFaces();
  }

  useEffect(() => {
    if (!loaded || Platform.OS !== 'web') return;
    let cancelled = false;
    void waitForWebFontFaces().then(() => {
      if (!cancelled) setWebFacesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  return loaded && webFacesReady;
}
