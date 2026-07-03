import { useState } from 'react';
import { View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Text } from '@/components/ui/text';
import { migrateLocalCollectionToRemote } from '@/services/collectionService';
import { authClient } from '@/src/lib/auth-client';
import { collectionQueryKeys } from '@/src/api/queryKeys';
import { useQueryClient } from '@tanstack/react-query';

type Mode = 'sign-in' | 'sign-up';

export function AuthPanel() {
  const queryClient = useQueryClient();
  const sessionQuery = authClient.useSession();
  const { data: session, isPending } = sessionQuery;
  const [mode, setMode] = useState<Mode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'sign-up') {
        const result = await authClient.signUp.email({ email, password, name });
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
      void queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all });
    } finally {
      setBusy(false);
    }
  };

  if (isPending) {
    return (
      <Card>
        <CardContent className="py-4">
          <Text className="text-muted-foreground">Loading account…</Text>
        </CardContent>
      </Card>
    );
  }

  if (session?.user) {
    return (
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

  return (
    <Card>
      <CardContent className="gap-4 py-4">
        <View className="gap-1">
          <Text className="text-base font-semibold text-foreground">
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Sync your collection across devices
          </Text>
        </View>

        {mode === 'sign-up' ? (
          <View className="gap-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholder="Your name"
            />
          </View>
        ) : null}

        <View className="gap-2">
          <Label>Email</Label>
          <Input
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
        </View>

        <View className="gap-2">
          <Label>Password</Label>
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
          />
        </View>

        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

        <Button onPress={handleSubmit} disabled={busy} busy={busy}>
          <ButtonText>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</ButtonText>
        </Button>

        <Button
          variant="ghost"
          onPress={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            setError(null);
          }}
        >
          <ButtonText>
            {mode === 'sign-in'
              ? 'Need an account? Sign up'
              : 'Already have an account? Sign in'}
          </ButtonText>
        </Button>
      </CardContent>
    </Card>
  );
}
