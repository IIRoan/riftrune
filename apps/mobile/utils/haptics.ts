import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export async function hapticPress(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore
  }
}
