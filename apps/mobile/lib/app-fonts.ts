/**
 * Expo font map — kept separate from font helpers so unit tests can import
 * `lib/fonts` without loading binary `.ttf` assets.
 */
export const APP_FONTS = {
  'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
  'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
  'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
  'Inter-ExtraBold': require('@/assets/fonts/Inter-ExtraBold.ttf'),
  'Inter-Black': require('@/assets/fonts/Inter-Black.ttf'),
  'GeistMono-Regular': require('@/assets/fonts/GeistMono-Regular.ttf'),
  'GeistMono-Medium': require('@/assets/fonts/GeistMono-Medium.ttf'),
  'GeistMono-SemiBold': require('@/assets/fonts/GeistMono-SemiBold.ttf'),
  'GeistMono-Bold': require('@/assets/fonts/GeistMono-Bold.ttf'),
} as const;
