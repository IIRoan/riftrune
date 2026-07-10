import { useEffect, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { AuthPanelVariant, AuthScreenLayout, Mode } from '@/components/auth/auth-types';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TextInput } from '@/components/ui/text-input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Text } from '@/components/ui/text';
import { migrateLocalCollectionToRemote } from '@/services/collectionService';
import { clearPersistedCollection } from '@/services/collectionCacheService';
import { clearPersistedCatalogIndex } from '@/services/catalogIndexService';
import { authClient } from '@/src/lib/auth-client';
import { collectionQueryKeys } from '@/src/api/queryKeys';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

const MODE_TRANSITION_MS = 480;

type AuthPanelProps = {
  variant?: AuthPanelVariant;
  screenLayout?: AuthScreenLayout;
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
};

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

function AuthModeTabs({
  mode,
  onModeChange,
  reduceMotion,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  reduceMotion: boolean;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentIndex = useSharedValue(mode === 'sign-in' ? 0 : 1);

  useEffect(() => {
    const duration = reduceMotion ? 0 : MODE_TRANSITION_MS;
    segmentIndex.value = withTiming(mode === 'sign-in' ? 0 : 1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [mode, reduceMotion, segmentIndex]);

  const segmentWidth = trackWidth > 0 ? (trackWidth - 4) / 2 : 0;
  const segmentWidthSv = useSharedValue(segmentWidth);

  useEffect(() => {
    segmentWidthSv.value = segmentWidth;
  }, [segmentWidth, segmentWidthSv]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: segmentIndex.value * segmentWidthSv.value }],
    width: segmentWidthSv.value,
  }));

  return (
    <View
      className="relative flex-row gap-1 rounded-lg border border-border bg-card-panel p-1"
      accessibilityRole="tablist"
      onLayout={(event: LayoutChangeEvent) => {
        setTrackWidth(event.nativeEvent.layout.width);
      }}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          className="absolute top-1 bottom-1 left-1 rounded-md bg-primary"
          style={indicatorStyle}
        />
      ) : null}
      {(['sign-in', 'sign-up'] as const).map((option) => {
        const selected = mode === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className="z-10 min-h-10 flex-1 items-center justify-center rounded-md"
            onPress={() => {
              onModeChange(option);
            }}
          >
            <Text
              className={cn(
                'text-sm font-semibold',
                selected ? 'text-primary-foreground' : 'text-foreground'
              )}
            >
              {option === 'sign-in' ? 'Sign in' : 'Register'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AuthModeCopy({
  mode,
  isScreen,
  wide,
}: {
  mode: Mode;
  isScreen: boolean;
  wide?: boolean;
}) {
  const reduceMotion = useReduceMotion();
  const signInOpacity = useSharedValue(mode === 'sign-in' ? 1 : 0);
  const signUpOpacity = useSharedValue(mode === 'sign-up' ? 1 : 0);

  useEffect(() => {
    const duration = reduceMotion ? 0 : MODE_TRANSITION_MS;
    const easing = Easing.out(Easing.cubic);
    signInOpacity.value = withTiming(mode === 'sign-in' ? 1 : 0, { duration, easing });
    signUpOpacity.value = withTiming(mode === 'sign-up' ? 1 : 0, { duration, easing });
  }, [mode, reduceMotion, signInOpacity, signUpOpacity]);

  const signInStyle = useAnimatedStyle(() => ({
    opacity: signInOpacity.value,
    transform: [{ translateY: (1 - signInOpacity.value) * 6 }],
  }));

  const signUpStyle = useAnimatedStyle(() => ({
    opacity: signUpOpacity.value,
    transform: [{ translateY: (1 - signUpOpacity.value) * 6 }],
  }));

  const titleClass = cn(
    'font-bold text-foreground',
    wide ? 'text-3xl tracking-tight' : isScreen ? 'text-xl font-semibold' : 'text-base font-semibold'
  );
  const subtitleClass = cn(
    'text-muted-foreground',
    wide ? 'mt-2 text-base leading-relaxed' : 'text-sm'
  );

  return (
    <View className={cn('justify-center', wide ? 'min-h-[96px]' : 'min-h-[52px]')}>
      <Animated.View
        style={[{ position: 'absolute', left: 0, right: 0 }, signInStyle]}
        pointerEvents="none"
      >
        <Text className={titleClass}>Welcome back</Text>
        <Text className={subtitleClass}>
          Sign in to sync your collection, prices, and printings across every device.
        </Text>
      </Animated.View>
      <Animated.View
        style={[{ position: 'absolute', left: 0, right: 0 }, signUpStyle]}
        pointerEvents="none"
      >
        <Text className={titleClass}>Create your account</Text>
        <Text className={subtitleClass}>
          One account keeps your archive aligned everywhere you collect.
        </Text>
      </Animated.View>
    </View>
  );
}

export function AuthPanel({
  variant = 'inline',
  screenLayout = 'mobile',
  mode: controlledMode,
  onModeChange,
}: AuthPanelProps) {
  const queryClient = useQueryClient();
  const sessionQuery = authClient.useSession();
  const { data: session, isPending } = sessionQuery;
  const [internalMode, setInternalMode] = useState<Mode>('sign-in');
  const mode = controlledMode ?? internalMode;
  const isScreen = variant === 'screen';
  const isWideScreen = isScreen && screenLayout === 'wide';
  const reduceMotion = useReduceMotion();

  const setMode = (next: Mode) => {
    if (controlledMode === undefined) {
      setInternalMode(next);
    }
    onModeChange?.(next);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const handleSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'sign-up') {
        const localName = email.trim().split('@')[0]?.trim();
        const result = await authClient.signUp.email({
          email,
          password,
          name: localName || 'Collector',
        });
        if (result.error) {
          setError(result.error.message ?? 'Sign up failed');
          return;
        }
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message ?? 'Sign in failed');
          return;
        }
      }
      await sessionQuery.refetch();
      await migrateLocalCollectionToRemote();
      void queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: collectionQueryKeys.ownershipRoot });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await authClient.signOut();
      await sessionQuery.refetch();
      await clearPersistedCollection();
      await clearPersistedCatalogIndex();
      void queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: collectionQueryKeys.ownershipRoot });
    } finally {
      setBusy(false);
    }
  };

  if (isPending) {
    return isScreen ? (
      <View className="gap-2 rounded-xl border border-border bg-card px-5 py-6">
        <Text className="text-muted-foreground">Loading account…</Text>
      </View>
    ) : (
      <Card>
        <CardContent className="py-4">
          <Text className="text-muted-foreground">Loading account…</Text>
        </CardContent>
      </Card>
    );
  }

  if (session?.user) {
    return isScreen ? null : (
      <Card>
        <CardContent className="gap-3 py-4">
          <Text className="text-base font-semibold text-foreground">
            {session.user.name}
          </Text>
          <Text className="text-sm text-muted-foreground">{session.user.email}</Text>
          <Text className="text-xs text-muted-foreground">
            Collection synced to your account
          </Text>
          <Button variant="outline" onPress={handleSignOut} disabled={busy} busy={busy}>
            <ButtonText>Sign out</ButtonText>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formBody = (
    <>
      {isScreen ? (
        <AuthModeCopy mode={mode} isScreen={isScreen} wide={isWideScreen} />
      ) : (
        <View className="gap-1">
          <Text className="text-base font-semibold text-foreground">
            {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {mode === 'sign-in'
              ? 'Pick up where you left off with your collection.'
              : 'One account keeps printings and prices in sync everywhere.'}
          </Text>
        </View>
      )}

      {isScreen && !isWideScreen ? (
        <AuthModeTabs mode={mode} onModeChange={setMode} reduceMotion={reduceMotion} />
      ) : null}

      <View className="gap-5">
        <View className="gap-2">
          <Label>Email</Label>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </View>

        <View className="gap-2">
          <Label>Password</Label>
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          />
        </View>

        {error ? (
          <Text className="text-sm text-destructive" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Button onPress={handleSubmit} disabled={busy} busy={busy} size={isScreen ? 'lg' : 'default'}>
          <ButtonText>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</ButtonText>
          {isWideScreen ? (
            <ButtonIcon>
              <Ionicons name="arrow-forward" size={18} />
            </ButtonIcon>
          ) : null}
        </Button>
      </View>

      {isScreen && isWideScreen ? (
        <Pressable
          accessibilityRole="button"
          className="self-start active:opacity-70"
          onPress={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
          }}
        >
          <Text className="text-sm text-muted-foreground">
            {mode === 'sign-in' ? "Don't have an account? " : 'Already have an account? '}
            <Text className="font-semibold text-foreground">
              {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </Pressable>
      ) : null}

      {!isScreen ? (
        <Button
          variant="ghost"
          onPress={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
          }}
        >
          <ButtonText>
            {mode === 'sign-in'
              ? 'Need an account? Sign up'
              : 'Already have an account? Sign in'}
          </ButtonText>
        </Button>
      ) : null}
    </>
  );

  if (isScreen) {
    if (isWideScreen) {
      return <View className="w-full gap-8">{formBody}</View>;
    }

    return <View className="gap-6">{formBody}</View>;
  }

  return (
    <Card>
      <CardContent className="gap-4 py-4">{formBody}</CardContent>
    </Card>
  );
}
