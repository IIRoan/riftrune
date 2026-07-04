import { useFonts } from 'expo-font';
import { APP_FONTS } from '@/lib/fonts';

export function useAppFonts(): boolean {
  const [loaded] = useFonts(APP_FONTS);
  return loaded;
}
