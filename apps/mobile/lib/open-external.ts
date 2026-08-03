import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { hapticPress } from '@/utils/haptics';

/**
 * Open an https URL outside the app.
 * Web uses Linking (full tab) — expo-web-browser's popup features often land on
 * about:blank when the destination (e.g. Cardmarket) blocks constrained windows.
 * Native keeps the in-app browser sheet.
 */
export async function openExternalUrl(url: string): Promise<void> {
  await hapticPress();
  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}
