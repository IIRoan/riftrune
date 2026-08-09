/**
 * Expo font map — kept separate from font helpers so unit tests can import
 * `lib/fonts` without loading binary `.ttf` assets.
 */
export const APP_FONTS = {
  'Geist-Regular': require('@/assets/fonts/Geist-Regular.ttf'),
  'Geist-Medium': require('@/assets/fonts/Geist-Medium.ttf'),
  'Geist-SemiBold': require('@/assets/fonts/Geist-SemiBold.ttf'),
  'Geist-Bold': require('@/assets/fonts/Geist-Bold.ttf'),
  'Geist-Black': require('@/assets/fonts/Geist-Black.ttf'),
  'GeistMono-Regular': require('@/assets/fonts/GeistMono-Regular.ttf'),
  'GeistMono-Medium': require('@/assets/fonts/GeistMono-Medium.ttf'),
  'GeistMono-SemiBold': require('@/assets/fonts/GeistMono-SemiBold.ttf'),
  'GeistMono-Bold': require('@/assets/fonts/GeistMono-Bold.ttf'),
} as const;
