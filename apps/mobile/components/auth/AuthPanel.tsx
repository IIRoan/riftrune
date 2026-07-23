import { LogOutIcon } from '@/components/icons';
import { useEffect, useId, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  type TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthPanelVariant, AuthScreenLayout, Mode } from '@/components/auth/auth-types';
import { AuthSlabCorners } from '@/components/auth/AuthArtifacts';
import { Button, ButtonText } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { cn } from '@/lib/utils';
import { clearPersistedCatalogIndex } from '@/services/catalogIndexService';
import { clearPersistedCollection } from '@/services/collectionCacheService';
import { migrateLocalCollectionToRemote } from '@/services/collectionService';
import { invalidateUserDataQueries, removeUserDataQueries } from '@/src/api/queryClient';
import { authClient } from '@/src/lib/auth-client';

const MODE_TRANSITION_MS = 280;
const MODE_OPTIONS = [
  { id: 'sign-in' as const, label: 'Sign in' },
  { id: 'sign-up' as const, label: 'Sign up' },
] as const;

type AuthPanelProps = {
  variant?: AuthPanelVariant;
  screenLayout?: AuthScreenLayout;
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
  className?: string;
};

function ModeSwitch({
  mode,
  onModeChange,
  disabled,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  disabled?: boolean;
}) {
  const reduceMotion = useReduceMotion();
  const [layouts, setLayouts] = useState<Partial<Record<Mode, { x: number; width: number }>>>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const hasMeasured = useSharedValue(0);

  useEffect(() => {
    const layout = layouts[mode];
    if (!layout) return;
    const duration = reduceMotion ? 0 : MODE_TRANSITION_MS;
    const easing = Easing.out(Easing.cubic);
    if (hasMeasured.value === 0) {
      indicatorX.value = layout.x;
      indicatorWidth.value = layout.width;
      hasMeasured.value = 1;
      return;
    }
    indicatorX.value = withTiming(layout.x, { duration, easing });
    indicatorWidth.value = withTiming(layout.width, { duration, easing });
  }, [hasMeasured, indicatorWidth, indicatorX, layouts, mode, reduceMotion]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: hasMeasured.value,
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View accessibilityRole="tablist" className="relative border-b border-border">
      <View className="flex-row gap-6">
        {MODE_OPTIONS.map((option) => {
          const selected = mode === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              disabled={disabled}
              className="min-h-11 justify-center pb-3 active:opacity-70"
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                setLayouts((current) => {
                  const previous = current[option.id];
                  if (previous?.x === x && previous.width === width) return current;
                  return { ...current, [option.id]: { x, width } };
                });
              }}
              onPress={() => {
                onModeChange(option.id);
              }}
            >
              <Text
                className={cn(
                  'text-[15px] font-semibold tracking-tight',
                  selected ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View
        pointerEvents="none"
        className="absolute bottom-0 left-0 h-0.5 bg-foreground"
        style={indicatorStyle}
      />
    </View>
  );
}

/** Keep React state in sync when password managers fill without a reliable onChangeText. */
function syncFieldText(
  onChangeText: (value: string) => void
): NonNullable<RNTextInputProps['onEndEditing']> {
  return (event) => {
    onChangeText(event.nativeEvent.text);
  };
}

function webFieldProps(name: string, id: string): Record<string, string> | null {
  if (Platform.OS !== 'web') return null;
  return { name, id };
}

type AuthFieldProps = {
  onChangeText: (value: string) => void;
  onSubmitEditing?: RNTextInputProps['onSubmitEditing'];
  inputRef?: React.RefObject<RNTextInput | null>;
  disabled?: boolean;
};

function AuthEmailField({
  onChangeText,
  onSubmitEditing,
  inputRef,
  disabled,
  nextFieldRef,
}: AuthFieldProps & { nextFieldRef?: React.RefObject<RNTextInput | null> }) {
  const labelId = useId();

  return (
    <View className="gap-2">
      <Label nativeID={labelId}>Email</Label>
      <TextInput
        ref={inputRef}
        defaultValue=""
        onChangeText={onChangeText}
        onEndEditing={syncFieldText(onChangeText)}
        disabled={disabled}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="username"
        textContentType="username"
        keyboardType="email-address"
        inputMode="email"
        importantForAutofill="yes"
        returnKeyType="next"
        submitBehavior="submit"
        enablesReturnKeyAutomatically
        placeholder="you@example.com"
        accessibilityLabel="Email"
        accessibilityLabelledBy={labelId}
        {...webFieldProps('username', 'auth-username')}
        onSubmitEditing={(event) => {
          onChangeText(event.nativeEvent.text);
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

function AuthPasswordField({
  mode,
  onChangeText,
  onSubmitEditing,
  inputRef,
  disabled,
}: AuthFieldProps & { mode: Mode }) {
  const labelId = useId();
  const isSignUp = mode === 'sign-up';

  return (
    <View className="gap-2">
      <Label nativeID={labelId}>Password</Label>
      <TextInput
        ref={inputRef}
        defaultValue=""
        onChangeText={onChangeText}
        onEndEditing={syncFieldText(onChangeText)}
        disabled={disabled}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete={
          isSignUp ? 'new-password' : Platform.OS === 'web' ? 'current-password' : 'password'
        }
        textContentType={isSignUp ? 'newPassword' : 'password'}
        passwordRules={
          isSignUp ? 'minlength: 8; required: lower; required: upper; required: digit;' : undefined
        }
        importantForAutofill="yes"
        returnKeyType="go"
        submitBehavior="submit"
        enablesReturnKeyAutomatically
        placeholder={isSignUp ? 'At least 8 characters' : 'Password'}
        accessibilityLabel="Password"
        accessibilityLabelledBy={labelId}
        {...webFieldProps(
          isSignUp ? 'new-password' : 'password',
          isSignUp ? 'auth-new-password' : 'auth-password'
        )}
        onSubmitEditing={(event) => {
          onChangeText(event.nativeEvent.text);
          onSubmitEditing?.(event);
        }}
      />
    </View>
  );
}

function readNativeInputValue(
  ref: React.RefObject<RNTextInput | null>,
  fallback: string
): string {
  if (Platform.OS === 'web') {
    const node = ref.current as unknown as { value?: string } | null;
    if (typeof node?.value === 'string' && node.value.length > 0) {
      return node.value;
    }
  }
  return fallback;
}

export function AuthPanel({
  variant = 'inline',
  screenLayout = 'mobile',
  mode: controlledMode,
  onModeChange,
  className,
}: AuthPanelProps) {
  const queryClient = useQueryClient();
  const sessionQuery = authClient.useSession();
  const { data: session, isPending, isRefetching } = sessionQuery;
  const [internalMode, setInternalMode] = useState<Mode>('sign-in');
  const mode = controlledMode ?? internalMode;
  const isScreen = variant === 'screen';
  const isWideScreen = isScreen && screenLayout === 'wide';

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
    setEmail('');
    setPassword('');
  }, [mode]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    const emailValue = readNativeInputValue(emailRef, email).trim();
    const passwordValue = readNativeInputValue(passwordRef, password);
    setEmail(emailValue);
    setPassword(passwordValue);
    if (emailValue.length === 0 || passwordValue.length === 0) {
      setError('Enter email and password');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'sign-up') {
        const localName = emailValue.split('@')[0]?.trim();
        const result = await authClient.signUp.email({
          email: emailValue,
          password: passwordValue,
          name: localName || 'Collector',
        });
        if (result.error) {
          setError(result.error.message ?? 'Sign up failed');
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: emailValue,
          password: passwordValue,
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

  // Skip loader during background session refetches so the form stays mounted.
  if (isPending && !isRefetching) {
    return isScreen ? (
      <View className={cn('gap-2 px-1 py-2', className)}>
        <Text className="text-muted-foreground">Loading account…</Text>
      </View>
    ) : (
      <View
        className={cn(
          'rounded-xl border border-border bg-card px-4 py-5',
          className
        )}
      >
        <Text className="text-muted-foreground">Loading account…</Text>
      </View>
    );
  }

  if (session?.user) {
    const initial = session.user.name?.charAt(0).toUpperCase() || '?';
    return isScreen ? null : (
      <View
        className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-card',
          className
        )}
      >
        <AuthSlabCorners />
        <View className="min-h-0 flex-1 flex-row items-stretch">
          <View className="w-[76px] items-center justify-center border-r border-border bg-background py-6">
            <View className="size-12 items-center justify-center rounded-lg bg-primary">
              <Text className="font-mono text-xl font-bold text-primary-foreground">{initial}</Text>
            </View>
          </View>
          <View className="min-w-0 flex-1 justify-between gap-4 px-4 py-4">
            <View className="gap-1">
              <Text
                className="text-lg font-semibold tracking-tight text-foreground"
                numberOfLines={1}
              >
                {session.user.name}
              </Text>
              <Text className="font-mono text-[12px] text-muted-foreground" numberOfLines={1}>
                {session.user.email}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              disabled={busy}
              onPress={() => {
                void handleSignOut();
              }}
              className="self-start flex-row items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 active:bg-primary/20"
            >
              <LogOutIcon className="size-3.5 text-archive-accent-text" weight="bold" />
              <Text className="text-sm font-semibold text-archive-accent-text">Sign out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const formBody = (
    <View
      className={cn('gap-5', isWideScreen && 'gap-6')}
      {...(Platform.OS === 'web' ? ({ role: 'form' } as Record<string, string>) : null)}
    >
      <ModeSwitch mode={mode} onModeChange={setMode} disabled={busy} />

      <View key={mode} className="gap-4">
        <AuthEmailField
          onChangeText={setEmail}
          inputRef={emailRef}
          nextFieldRef={passwordRef}
          disabled={busy}
        />

        <AuthPasswordField
          mode={mode}
          onChangeText={setPassword}
          inputRef={passwordRef}
          disabled={busy}
          onSubmitEditing={() => {
            void handleSubmit();
          }}
        />

        {error ? (
          <View className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
            <Text
              className="text-sm text-destructive"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {error}
            </Text>
          </View>
        ) : null}

        <Button
          className="mt-1"
          onPress={() => {
            void handleSubmit();
          }}
          disabled={busy}
          busy={busy}
          size="lg"
        >
          <ButtonText>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</ButtonText>
        </Button>
      </View>
    </View>
  );

  if (isScreen) {
    return <View className={cn('w-full', className)}>{formBody}</View>;
  }

  return (
    <View
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card px-4 py-4',
        className
      )}
    >
      <AuthSlabCorners />
      {formBody}
    </View>
  );
}
