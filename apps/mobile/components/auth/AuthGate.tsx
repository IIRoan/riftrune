import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  KeyboardAwareScrollView,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthBrandLockup,
  AuthDomainStrip,
  AuthSlabCorners,
} from '@/components/auth/AuthArtifacts';
import { AuthBackdrop, useAuthWideLayout } from '@/components/auth/AuthBackdrop';
import { AuthPanel } from '@/components/auth/AuthPanel';
import type { Mode } from '@/components/auth/auth-types';
import { AppLoadingScreen } from '@/components/ui/app-loader';
import { hydrateCollectionCache, prefetchCollection } from '@/hooks/useCollection';
import { prefetchCatalogIndex } from '@/hooks/useCatalogIndex';
import { authClient } from '@/src/lib/auth-client';

/** Mobile: hero art + floating form slab. Whole playmat scrolls with the keyboard. */
function AuthMobilePlaymat({
  mode,
  onModeChange,
  insets,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  insets: { top: number; bottom: number };
}) {
  const { height: windowHeight } = useWindowDimensions();
  const artHeight = Math.round(windowHeight * 0.38);
  const { progress } = useReanimatedKeyboardAnimation();

  const artStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [artHeight, 64], Extrapolation.CLAMP),
  }));

  return (
    <View className="flex-1 bg-background">
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={48}
        extraKeyboardSpace={Platform.OS === 'ios' ? 16 : 28}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View className="relative overflow-hidden" style={artStyle}>
          <AuthBackdrop mode={mode} variant="hero" />
          <View
            className="absolute inset-x-0 top-0 px-5"
            style={{ paddingTop: insets.top + 14 }}
            pointerEvents="none"
          >
            <AuthBrandLockup light showDomains={false} />
          </View>
          <View className="absolute inset-x-5 bottom-8" pointerEvents="none">
            <AuthDomainStrip size={26} />
          </View>
        </Animated.View>

        <View
          className="relative z-10 -mt-4 flex-1 rounded-t-2xl border-t border-border bg-background px-6 pt-6"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 28 }}
        >
          <View className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-2xl">
            <AuthSlabCorners />
          </View>
          <AuthPanel
            variant="screen"
            screenLayout="mobile"
            mode={mode}
            onModeChange={onModeChange}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

function AuthWidePlaymat({
  mode,
  onModeChange,
  insets,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  insets: { top: number; bottom: number };
}) {
  const { width } = useWindowDimensions();
  const slabWidth = Math.min(420, Math.max(360, width * 0.36));

  return (
    <View className="relative min-h-0 flex-1 overflow-hidden bg-background web:min-h-screen web:w-full">
      <AuthBackdrop mode={mode} variant="contained" />

      <View
        className="absolute inset-y-0 left-0 w-[52%] max-w-[640px] bg-background/80"
        pointerEvents="none"
      />

      <View
        className="absolute inset-y-0 justify-center"
        style={{
          left: Math.max(32, width * 0.06),
          width: slabWidth,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bottomOffset={32}
          extraKeyboardSpace={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <View className="relative rounded-xl border border-border bg-background/95 px-8 py-9 shadow-lg shadow-black/40">
            <AuthSlabCorners />
            <AuthBrandLockup />
            <View className="mt-8">
              <AuthPanel
                variant="screen"
                screenLayout="wide"
                mode={mode}
                onModeChange={onModeChange}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </View>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const wide = useAuthWideLayout();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [sessionReady, setSessionReady] = useState(false);
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      setSessionReady(true);
    }
  }, [isPending]);

  useEffect(() => {
    if (!session?.user) return;
    void (async () => {
      await hydrateCollectionCache(queryClient);
      await prefetchCatalogIndex(queryClient);
      await prefetchCollection(queryClient);
    })();
  }, [session?.user, queryClient]);

  // First session resolve only — later refetches must not remount the login UI.
  if (!sessionReady) {
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
      return <AuthWidePlaymat mode={mode} onModeChange={setMode} insets={insets} />;
    }
    return <AuthMobilePlaymat mode={mode} onModeChange={setMode} insets={insets} />;
  }

  return <>{children}</>;
}
