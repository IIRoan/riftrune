import { useEffect, useId, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  Platform,
  Pressable,
  TextInput as RNTextInput,
  View,
  type LayoutChangeEvent,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthPanelVariant, AuthScreenLayout, Mode } from '@/components/auth/auth-types';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { cn } from '@/lib/utils';
import { clearPersistedCatalogIndex } from '@/services/catalogIndexService';
import { clearPersistedCollection } from '@/services/collectionCacheService';
import { migrateLocalCollectionToRemote } from '@/services/collectionService';
import { invalidateUserDataQueries, removeUserDataQueries } from '@/src/api/queryClient';
import { authClient } from '@/src/lib/auth-client';

const MODE_TRANSITION_MS = 220;

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
    segmentIndex.value = withTiming(mode === 'sign-in' ? 0 : 1, {
      duration: reduceMotion ? 0 : MODE_TRANSITION_MS,
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
            className="z-10 min-h-11 flex-1 items-center justify-center rounded-md"
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

function AuthHeading({ mode, wide }: { mode: Mode; wide?: boolean }) {
  const title =
    mode === 'sign-in' ? 'Welcome back' : 'Create your account';
  const subtitle =
    mode === 'sign-in'
      ? 'Sync your collection, prices, and printings across devices.'
      : 'One account keeps ownership and prices aligned everywhere you collect.';

  return (
    <View className={cn('gap-2', wide ? 'min-h-[88px]' : 'min-h-[72px]')}>
      <Text
        className={cn(
          'font-semibold text-foreground tracking-tight',
          wide ? 'text-3xl' : 'text-2xl'
        )}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Text className={cn('text-muted-foreground leading-5', wide ? 'text-base' : 'text-sm')}>
        {subtitle}
      </Text>
    </View>
  );
}

type AutofillEmailProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmitEditing?: RNTextInputProps['onSubmitEditing'];
  inputRef?: React.RefObject<RNTextInput | null>;
  disabled?: boolean;
  nextFieldRef?: React.RefObject<RNTextInput | null>;
};

function AutofillEmailField({
  value,
  onChangeText,
  onSubmitEditing,
  inputRef,
  disabled,
  nextFieldRef,
}: AutofillEmailProps) {
  const labelId = useId();

  return (
    <View className="gap-2">
      <Label nativeID={labelId}>Email</Label>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        disabled={disabled}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        keyboardType="email-address"
        inputMode="email"
        importantForAutofill="yes"
        returnKeyType="next"
        submitBehavior="submit"
        enablesReturnKeyAutomatically
        placeholder="you@example.com"
        accessibilityLabelledBy={labelId}
        onSubmitEditing={(event) => {
          if (nextFieldRef?.current) {
            nextFieldRef.current.focus();
            return;
          }
          onSubmitEditing?.(event);
        }}
      />
    </View>
  );
}

type AutofillPasswordProps = {
  mode: Mode;
  value: string;
  onChangeText: (value: string) => void;
  onSubmitEditing?: RNTextInputProps['onSubmitEditing'];
  inputRef?: React.RefObject<RNTextInput | null>;
  disabled?: boolean;
};

function AutofillPasswordField({
  mode,
  value,
  onChangeText,
  onSubmitEditing,
  inputRef,
  disabled,
}: AutofillPasswordProps) {
  const labelId = useId();
  const isSignUp = mode === 'sign-up';

  return (
    <View className="gap-2">
      <Label nativeID={labelId}>Password</Label>
      <PasswordInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        disabled={disabled}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={isSignUp ? 'new-password' : 'password'}
        textContentType={isSignUp ? 'newPassword' : 'password'}
        passwordRules={
          isSignUp ? 'minlength: 8; required: lower; required: upper; required: digit;' : undefined
        }
        importantForAutofill="yes"
        returnKeyType="go"
        submitBehavior="submit"
        enablesReturnKeyAutomatically
        placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
        accessibilityLabelledBy={labelId}
        onSubmitEditing={onSubmitEditing}
      />
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

  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

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
    Keyboard.dismiss();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'sign-up') {
        const localName = email.trim().split('@')[0]?.trim();
        const result = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: localName || 'Collector',
        });
        if (result.error) {
          setError(result.error.message ?? 'Sign up failed');
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (result.error) {
          setError(result.error.message ?? 'Sign in failed');
          return;
        }
      }
      await sessionQuery.refetch();
      await migrateLocalCollectionToRemote();
      await invalidateUserDataQueries(queryClient);
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
      removeUserDataQueries(queryClient);
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
          <Text className="text-base font-semibold text-foreground">{session.user.name}</Text>
          <Text className="text-sm text-muted-foreground">{session.user.email}</Text>
          <Text className="text-xs text-muted-foreground">Collection synced to your account</Text>
          <Button variant="outline" onPress={handleSignOut} disabled={busy} busy={busy}>
            <ButtonText>Sign out</ButtonText>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formBody = (
    <View
      className={cn('gap-6', isWideScreen && 'gap-8')}
      {...(Platform.OS === 'web' ? ({ role: 'form' } as Record<string, string>) : null)}
    >
      <AuthHeading mode={mode} wide={isWideScreen} />

      {isScreen && !isWideScreen ? (
        <AuthModeTabs mode={mode} onModeChange={setMode} reduceMotion={reduceMotion} />
      ) : null}

      <View className="gap-4">
        <AutofillEmailField
          value={email}
          onChangeText={setEmail}
          inputRef={emailRef}
          nextFieldRef={passwordRef}
          disabled={busy}
        />

        <AutofillPasswordField
          mode={mode}
          value={password}
          onChangeText={setPassword}
          inputRef={passwordRef}
          disabled={busy}
          onSubmitEditing={() => {
            void handleSubmit();
          }}
        />

        {error ? (
          <Text
            className="text-sm text-destructive"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {error}
          </Text>
        ) : null}

        <Button
          onPress={() => {
            void handleSubmit();
          }}
          disabled={busy || email.trim().length === 0 || password.length === 0}
          busy={busy}
          size={isScreen ? 'lg' : 'default'}
        >
          <ButtonText>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</ButtonText>
          {isWideScreen ? (
            <ButtonIcon>
              <Ionicons name="arrow-forward" size={18} />
            </ButtonIcon>
          ) : null}
        </Button>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          mode === 'sign-in' ? 'Switch to create account' : 'Switch to sign in'
        }
        className="min-h-11 justify-center self-start active:opacity-70"
        disabled={busy}
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
    </View>
  );

  if (isScreen) {
    return <View className="w-full">{formBody}</View>;
  }

  return (
    <Card>
      <CardContent className="gap-4 py-4">{formBody}</CardContent>
    </Card>
  );
}
