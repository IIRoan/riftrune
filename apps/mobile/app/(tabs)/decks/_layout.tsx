import { Stack } from 'expo-router';

export default function DecksLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="browse" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/add" />
    </Stack>
  );
}
