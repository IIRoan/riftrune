/**
 * Expo font map — kept separate from font helpers so unit tests can import
 * `lib/fonts` without loading binary `.ttf` assets.
 */
export const APP_FONTS = {
  'Lato-Regular': require('@/assets/fonts/Lato-Regular.ttf'),
  'Lato-Medium': require('@/assets/fonts/Lato-Medium.ttf'),
  'Lato-SemiBold': require('@/assets/fonts/Lato-SemiBold.ttf'),
  'Lato-Bold': require('@/assets/fonts/Lato-Bold.ttf'),
  'Lato-Black': require('@/assets/fonts/Lato-Black.ttf'),
  'GeistMono-Regular': require('@/assets/fonts/GeistMono-Regular.ttf'),
  'GeistMono-Medium': require('@/assets/fonts/GeistMono-Medium.ttf'),
  'GeistMono-SemiBold': require('@/assets/fonts/GeistMono-SemiBold.ttf'),
  'GeistMono-Bold': require('@/assets/fonts/GeistMono-Bold.ttf'),
} as const;
