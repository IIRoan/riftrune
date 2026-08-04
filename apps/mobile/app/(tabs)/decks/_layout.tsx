import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useReduceMotion } from '@/hooks/useReduceMotion';

export default function DecksLayout() {
  const reduceMotion = useReduceMotion();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Platform default = native push/pop (iOS edge swipe, Android material).
        animation: reduceMotion ? 'fade' : 'default',
        gestureEnabled: true,
        fullScreenGestureEnabled: Platform.OS === 'ios',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="browse" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/add" />
    </Stack>
  );
}
