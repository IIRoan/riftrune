import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthWideLayout } from '@/components/auth/AuthBackdrop';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { AuthWallpaperFrame } from '@/components/auth/AuthWallpaperFrame';
import type { Mode } from '@/components/auth/auth-types';
import { AppLoadingScreen } from '@/components/ui/app-loader';
import { Text } from '@/components/ui/text';
import { authClient } from '@/src/lib/auth-client';
import { hydrateCollectionCache, prefetchCollection } from '@/hooks/useCollection';
import { prefetchCatalogIndex } from '@/hooks/useCatalogIndex';

function AuthBrandMark() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="size-10 items-center justify-center rounded-lg bg-primary">
        <Text className="font-mono text-base font-bold text-primary-foreground">r</Text>
      </View>
      <View className="gap-0.5">
        <Text className="text-base font-semibold tracking-tight text-foreground">Riftrune</Text>
        <Text className="text-xs text-muted-foreground">Collection & deck companion</Text>
      </View>
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
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
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
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
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) return;
    void (async () => {
      await hydrateCollectionCache(queryClient);
      await prefetchCatalogIndex(queryClient);
      await prefetchCollection(queryClient);
    })();
  }, [session?.user, queryClient]);

  if (isPending) {
    return (
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <AppLoadingScreen size="lg" className="bg-transparent" />
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
      <View className="flex-1 bg-background">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="min-h-0 flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 24,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-8">
              <AuthBrandMark />
            </View>

            <AuthPanel
              variant="screen"
              screenLayout="mobile"
              mode={mode}
              onModeChange={setMode}
            />

            <View className="mt-auto pt-10">
              <View className="h-[220px] w-full">
                <AuthWallpaperFrame mode={mode} className="h-full w-full" />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return <>{children}</>;
}
