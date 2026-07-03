import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { Text } from '@/components/ui/text';
import { authClient } from '@/src/lib/auth-client';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Text className="text-muted-foreground">Loading…</Text>
      </View>
    );
  }

  if (!session?.user) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8 items-center">
          <Text className="text-2xl font-bold text-foreground">Riftbound</Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Sign in or create an account to start building your collection
          </Text>
        </View>
        <AuthPanel />
      </ScrollView>
    );
  }

  return <>{children}</>;
}
