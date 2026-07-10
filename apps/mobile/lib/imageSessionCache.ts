import { Image } from 'expo-image';
import { Platform } from 'react-native';

const sessionLoadedUris = new Set<string>();

export function isSessionImageLoaded(uri: string): boolean {
  return sessionLoadedUris.has(uri);
}

export function markSessionImageLoaded(uri: string): void {
  sessionLoadedUris.add(uri);
}

export async function isDiskImageCached(uri: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const path = await Image.getCachePathAsync(uri);
    return path != null;
  } catch {
    return false;
  }
}
