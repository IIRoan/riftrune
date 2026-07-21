import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
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
import { AUTH_WALLPAPERS, AuthBackdrop, useAuthWideLayout } from '@/components/auth/AuthBackdrop';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { AuthWallpaperFrame } from '@/components/auth/AuthWallpaperFrame';
import type { Mode } from '@/components/auth/auth-types';
import { KeywordBadge } from '@/components/riftbound/KeywordBadge';
import { AppLoadingScreen } from '@/components/ui/app-loader';
import { Text } from '@/components/ui/text';
import { hydrateCollectionCache, prefetchCollection } from '@/hooks/useCollection';
import { prefetchCatalogIndex } from '@/hooks/useCatalogIndex';
import { authClient } from '@/src/lib/auth-client';

const HERO_HEIGHT_RATIO = 0.28;

function AuthCardFan({ mode }: { mode: Mode }) {
  const back = mode === 'sign-in' ? AUTH_WALLPAPERS['sign-up'] : AUTH_WALLPAPERS['sign-in'];
  const front = AUTH_WALLPAPERS[mode];

  return (
    <View
      className="absolute right-5 bottom-6"
      style={{ width: 108, height: 148 }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        className="absolute overflow-hidden rounded-md border border-white/15 bg-card"
        style={{
          width: 88,
          height: 124,
          left: 0,
          top: 16,
          transform: [{ rotate: '-9deg' }],
        }}
      >
        <Image source={back} contentFit="cover" className="h-full w-full" />
        <View className="absolute inset-0 bg-black/25" />
      </View>
      <View
        className="absolute overflow-hidden rounded-md border border-white/25 bg-card"
        style={{
          width: 92,
          height: 128,
          right: 0,
          top: 0,
          transform: [{ rotate: '5deg' }],
        }}
      >
        <Image source={front} contentFit="cover" className="h-full w-full" />
        <View className="absolute inset-0 bg-black/10" />
      </View>
    </View>
  );
}

function AuthMobileVault({
  mode,
  onModeChange,
  insets,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  insets: { top: number; bottom: number };
}) {
  const { height: windowHeight } = useWindowDimensions();
  const heroHeight = Math.round(windowHeight * HERO_HEIGHT_RATIO);
  const { progress } = useReanimatedKeyboardAnimation();

  const heroStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [heroHeight, 0], Extrapolation.CLAMP),
    opacity: interpolate(progress.value, [0, 0.55, 1], [1, 0.35, 0], Extrapolation.CLAMP),
  }));

  const heroContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [0, -16], Extrapolation.CLAMP),
      },
    ],
  }));

  const headlineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [1, 0], Extrapolation.CLAMP),
    maxHeight: interpolate(progress.value, [0, 1], [72, 0], Extrapolation.CLAMP),
    marginBottom: interpolate(progress.value, [0, 1], [10, 4], Extrapolation.CLAMP),
    overflow: 'hidden' as const,
  }));

  const compactTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.2, 0.5], [0, 1], Extrapolation.CLAMP),
    maxHeight: interpolate(progress.value, [0, 1], [0, 26], Extrapolation.CLAMP),
    marginBottom: interpolate(progress.value, [0, 1], [0, 6], Extrapolation.CLAMP),
    overflow: 'hidden' as const,
  }));

  return (
    <View className="flex-1 bg-background">
      <Animated.View className="overflow-hidden" style={heroStyle}>
        <AuthBackdrop mode={mode} variant="hero" />
        <Animated.View
          className="absolute inset-0 justify-end px-4 pb-3"
          style={[{ paddingTop: insets.top + 12 }, heroContentStyle]}
        >
          <AuthCardFan mode={mode} />
          <Text className="max-w-[220px] font-mono text-[11px] font-medium tracking-wide text-primary">
            RIFTRUNE ARCHIVE
          </Text>
          <Text
            className="mt-2 max-w-[220px] text-[28px] font-bold leading-[32px] tracking-tight text-white"
            accessibilityRole="header"
          >
            Rift
            <Text className="text-primary">rune</Text>
          </Text>
        </Animated.View>
      </Animated.View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={headlineStyle}>
          <Text className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === 'sign-in' ? 'Back to the binder' : 'New challenger'}
          </Text>
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <KeywordBadge
              label={mode === 'sign-in' ? 'PRIORITY' : 'VISION'}
              keywordBase={mode === 'sign-in' ? 'ACCELERATE' : 'VISION'}
              compact
            />
            <Text className="flex-1 text-sm leading-5 text-muted-foreground">
              {mode === 'sign-in'
                ? 'Your list’s here. Sideboard stays imaginary.'
                : 'Legends optional. Email is not.'}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={compactTitleStyle}>
          <Text className="text-lg font-semibold tracking-tight text-foreground">
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Text>
        </Animated.View>

        <AuthPanel
          variant="screen"
          screenLayout="mobile"
          presentation="immersive"
          mode={mode}
          onModeChange={onModeChange}
        />
      </KeyboardAwareScrollView>
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
      <View className="min-h-0 w-full max-w-[440px] shrink-0 border-r border-border">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: insets.top + 40,
            paddingHorizontal: 40,
            paddingBottom: insets.bottom + 48,
          }}
          keyboardShouldPersistTaps="handled"
          bottomOffset={24}
          showsVerticalScrollIndicator={false}
        >
          <Text className="font-mono text-[11px] font-medium tracking-wide text-primary">
            RIFTRUNE ARCHIVE
          </Text>
          <Text
            className="mt-2 text-3xl font-bold tracking-tight text-foreground"
            accessibilityRole="header"
          >
            Rift<Text className="text-primary">rune</Text>
          </Text>
          <Text className="mt-3 text-base leading-6 text-muted-foreground">
            {mode === 'sign-in'
              ? 'Sign in to sync your collection across devices.'
              : 'Create an account — still cheaper than a playset.'}
          </Text>
          <View className="mt-8">
            <AuthPanel
              variant="screen"
              screenLayout="wide"
              presentation="classic"
              mode={mode}
              onModeChange={onModeChange}
            />
          </View>
        </KeyboardAwareScrollView>
      </View>

      <View className="min-h-0 min-w-0 flex-1 items-center justify-center bg-card-panel px-10 py-12">
        <View className="w-full max-w-[340px] gap-4">
          <View className="aspect-[5/7] w-full">
            <AuthWallpaperFrame mode={mode} className="h-full w-full rounded-xl" />
          </View>
          <Text className="text-sm leading-5 text-muted-foreground">
            Fast collection tracking on top of Piltover Archive data. No neon. No excuses.
          </Text>
        </View>
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

    return <AuthMobileVault mode={mode} onModeChange={setMode} insets={insets} />;
  }

  return <>{children}</>;
}
