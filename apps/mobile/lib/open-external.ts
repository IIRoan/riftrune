import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { withInAppBrowserOverlaySuspended } from '@/lib/in-app-browser-overlay';
import { hapticPress } from '@/utils/haptics';

/** Open https outside the app: web via Linking (avoid about:blank popups); native in-app browser with iOS overlay suspended. */
export async function openExternalUrl(url: string): Promise<void> {
  await hapticPress();
  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return;
  }
  await withInAppBrowserOverlaySuspended(() => WebBrowser.openBrowserAsync(url));
}
