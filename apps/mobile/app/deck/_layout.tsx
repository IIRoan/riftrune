import { Stack } from 'expo-router';
import { AuthGate } from '@/components/auth/AuthGate';

export default function DeckLayout() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="create" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="[id]/add" />
      </Stack>
    </AuthGate>
  );
}
