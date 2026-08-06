import { Platform, useWindowDimensions } from 'react-native';

export function useAuthWideLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 768;
}
