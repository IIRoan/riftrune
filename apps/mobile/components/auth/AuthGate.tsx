import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthWideLayout } from '@/components/auth/AuthBackdrop';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { AuthWallpaperFrame } from '@/components/auth/AuthWallpaperFrame';
import type { Mode } from '@/components/auth/auth-types';
import { Text } from '@/components/ui/text';
import { authClient } from '@/src/lib/auth-client';

function AuthBrandMark() {
  return (
    <View className="size-9 items-center justify-center rounded-lg bg-primary">
      <Text className="font-mono text-sm font-bold text-primary-foreground">r</Text>
    </View>
  );
}

function AuthWideSplit({
  mode,
  onModeChange,
  insets,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  insets: { top: number; bottom: number };
}) {
  return (
    <View className="min-h-0 flex-1 flex-row bg-background web:min-h-screen web:w-full">
      <View className="min-h-0 w-full max-w-[480px] shrink-0">
        <View
          className="px-10"
          style={{ paddingTop: insets.top + 28, paddingBottom: 16 }}
        >
          <AuthBrandMark />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="min-h-0 flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: 40,
              paddingBottom: insets.bottom + 40,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="w-full max-w-[420px]">
              <AuthPanel
                variant="screen"
                screenLayout="wide"
                mode={mode}
                onModeChange={onModeChange}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <View
        className="min-h-0 min-w-0 flex-1"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
          paddingLeft: 12,
          paddingRight: 24,
        }}
      >
        <AuthWallpaperFrame mode={mode} className="h-full w-full" />
      </View>
    </View>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const wide = useAuthWideLayout();
  const [mode, setMode] = useState<Mode>('sign-in');
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
    if (wide) {
      return (
        <View className="flex-1 bg-background web:min-h-screen web:w-full">
          <AuthWideSplit mode={mode} onModeChange={setMode} insets={insets} />
        </View>
      );
    }

    return (
      <View
        className="flex-1 bg-background"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="min-h-0 flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-6">
              <AuthBrandMark />
            </View>
            <AuthPanel
              variant="screen"
              screenLayout="mobile"
              mode={mode}
              onModeChange={setMode}
            />
            <View className="mt-6 h-[340px] w-full">
              <AuthWallpaperFrame mode={mode} className="h-full w-full" />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return <>{children}</>;
}
