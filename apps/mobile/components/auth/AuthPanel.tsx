import { useEffect, useId, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  type TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type {
  AuthPanelVariant,
  AuthPresentation,
  AuthScreenLayout,
  Mode,
} from '@/components/auth/auth-types';
import { Button, ButtonText } from '@/components/ui/button';
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

type AuthPanelProps = {
  variant?: AuthPanelVariant;
  screenLayout?: AuthScreenLayout;
  presentation?: AuthPresentation;
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
};

function ModeSwitch({
  mode,
  onModeChange,
  disabled,
  immersive,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  disabled?: boolean;
  immersive?: boolean;
}) {
  if (immersive) {
    return (
      <View
        className="flex-row gap-1 rounded-xl bg-card-panel p-1"
        accessibilityRole="tablist"
      >
        {(['sign-in', 'sign-up'] as const).map((option) => {
          const selected = mode === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              disabled={disabled}
              className={cn(
                'min-h-11 flex-1 items-center justify-center rounded-lg',
                selected ? 'bg-primary' : 'bg-transparent'
              )}
              onPress={() => {
                onModeChange(option);
              }}
            >
              <Text
                className={cn(
                  'text-sm font-semibold',
                  selected ? 'text-primary-foreground' : 'text-muted-foreground'
                )}
              >
                {option === 'sign-in' ? 'Sign in' : 'Sign up'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View className="flex-row gap-6 border-b border-border" accessibilityRole="tablist">
      {(['sign-in', 'sign-up'] as const).map((option) => {
        const selected = mode === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            disabled={disabled}
            className="relative min-h-11 justify-end pb-2.5 active:opacity-70"
            onPress={() => {
              onModeChange(option);
            }}
          >
            <Text
              className={cn(
                'text-sm font-semibold',
                selected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {option === 'sign-in' ? 'Sign in' : 'Sign up'}
            </Text>
            <View
              className={cn(
                'absolute right-0 bottom-0 left-0 h-[2px] rounded-full',
                selected ? 'bg-primary' : 'bg-transparent'
              )}
            />
          </Pressable>
        );
      })}
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
  immersive?: boolean;
};

function AutofillPasswordField({
  mode,
  value,
  onChangeText,
  onSubmitEditing,
  inputRef,
  disabled,
  immersive,
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
        placeholder={
          immersive
            ? isSignUp
              ? '8+ characters'
              : 'Your secret — keep it sleeved'
            : isSignUp
              ? 'At least 8 characters'
              : 'Password'
        }
        accessibilityLabelledBy={labelId}
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  );
}

export function AuthPanel({
  variant = 'inline',
  screenLayout = 'mobile',
  presentation = 'classic',
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
  const immersive = presentation === 'immersive';

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
      <View className="gap-2 px-1 py-2">
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
      className={cn('gap-5', isWideScreen && 'gap-6')}
      {...(Platform.OS === 'web' ? ({ role: 'form' } as Record<string, string>) : null)}
    >
      {isScreen ? (
        <ModeSwitch
          mode={mode}
          onModeChange={setMode}
          disabled={busy}
          immersive={immersive}
        />
      ) : null}

      {!isScreen ? (
        <View className="gap-1">
          <Text className="text-xl font-semibold tracking-tight text-foreground">
            {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {mode === 'sign-in'
              ? 'Your collection is waiting on the other side of priority.'
              : 'One account. Infinite “I definitely own that.” claims.'}
          </Text>
        </View>
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
          immersive={immersive}
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
          disabled={busy || email.trim().length === 0 || password.length === 0}
          busy={busy}
          size="lg"
        >
          <ButtonText>
            {immersive
              ? mode === 'sign-in'
                ? 'Pass priority'
                : 'Enter the archive'
              : mode === 'sign-in'
                ? 'Sign in'
                : 'Create account'}
          </ButtonText>
        </Button>

        {isScreen && immersive ? (
          <Text className="text-center text-xs leading-4 text-muted-foreground">
            {mode === 'sign-in'
              ? 'Forgot password? Take a mulligan — feature not printed yet.'
              : 'Free to register. Still more effort than tapping a land.'}
          </Text>
        ) : null}
      </View>

      {!isScreen ? (
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
      ) : null}
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
