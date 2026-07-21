import * as Clipboard from 'expo-clipboard';
import { Alert, Platform, Pressable, View } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { Text } from '@/components/ui/text';
import {
  useCollectionShareMutations,
  useCollectionShareStatus,
} from '@/hooks/useCollectionShare';
import { authClient } from '@/src/lib/auth-client';
import { RemoteApiError } from '@/src/api/authedClient';

function confirmAction(title: string, message: string, onConfirm: () => void): void {
  if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
    if (globalThis.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', style: 'destructive', onPress: onConfirm },
  ]);
}

async function copyInviteLink(url: string): Promise<void> {
  await Clipboard.setStringAsync(url);
  toast.success('Invite link copied');
}

export function SharedCollectionSection() {
  const sessionQuery = authClient.useSession();
  const signedIn = Boolean(sessionQuery.data?.user);
  const statusQuery = useCollectionShareStatus(signedIn);
  const { createInvite, revokeInvite, leave } = useCollectionShareMutations();

  if (!signedIn) {
    return null;
  }

  const status = statusQuery.data;
  const pendingUrl = status?.pendingInvite?.url;
  const busy =
    createInvite.isPending || revokeInvite.isPending || leave.isPending || statusQuery.isLoading;

  const onCopyOrCreate = () => {
    if (pendingUrl) {
      void copyInviteLink(pendingUrl).catch(() => {
        Alert.alert('Invite link', pendingUrl);
      });
      return;
    }

    createInvite.mutate(undefined, {
      onSuccess: (invite) => {
        void copyInviteLink(invite.url).catch(() => {
          Alert.alert('Invite link', invite.url);
        });
      },
      onError: (error) => {
        const message =
          error instanceof RemoteApiError ? error.body || error.message : 'Could not create invite';
        Alert.alert('Invite failed', message);
      },
    });
  };

  const onLeave = () => {
    confirmAction(
      'Leave shared collection',
      'You will keep a full copy of the current shared inventory as your personal collection. Your partner keeps the shared list.',
      () => {
        leave.mutate(undefined, {
          onError: (error) => {
            const message =
              error instanceof RemoteApiError
                ? error.body || error.message
                : 'Could not leave shared collection';
            Alert.alert('Leave failed', message);
          },
        });
      }
    );
  };

  const onCancelInvite = () => {
    revokeInvite.mutate(undefined, {
      onSuccess: () => {
        toast.success('Invite cancelled');
      },
      onError: () => {
        Alert.alert('Cancel failed', 'Could not cancel invite');
      },
    });
  };

  return (
    <View className="gap-3">
      {statusQuery.isError ? (
        <Text className="text-sm text-muted-foreground">Could not load share status.</Text>
      ) : null}

      {status?.shared && status.partner ? (
        <View className="gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <View className="gap-0.5">
            <Text className="text-sm font-medium text-foreground">
              Shared with {status.partner.name}
            </Text>
            <Text className="text-sm text-muted-foreground">{status.partner.email}</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Both of you edit the same cards. Decks stay separate.
            </Text>
          </View>
          <Button variant="outline" disabled={busy} onPress={onLeave}>
            <ButtonText>Leave</ButtonText>
          </Button>
        </View>
      ) : (
        <View className="gap-3">
          <Text className="text-sm text-muted-foreground">
            Share one collection with a partner. Decks and wishlists stay personal.
          </Text>

          {pendingUrl ? (
            <View className="gap-2 rounded-xl border border-border bg-card px-4 py-3">
              <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Invite link
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copy invite link"
                disabled={busy}
                onPress={onCopyOrCreate}
                className="active:opacity-80"
              >
                <Text className="font-mono text-sm leading-5 text-foreground" selectable>
                  {pendingUrl}
                </Text>
              </Pressable>
              <View className="mt-1 flex-row items-center gap-3">
                <Button size="sm" disabled={busy} onPress={onCopyOrCreate} className="flex-1">
                  <ButtonText>Copy link</ButtonText>
                </Button>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={onCancelInvite}
                  className="px-2 py-2 active:opacity-70"
                >
                  <Text className="text-sm text-muted-foreground">Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Button disabled={busy} onPress={onCopyOrCreate}>
              <ButtonText>
                {createInvite.isPending ? 'Creating…' : 'Create invite link'}
              </ButtonText>
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
