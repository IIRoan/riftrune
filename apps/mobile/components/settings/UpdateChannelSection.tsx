import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';
import * as Updates from 'expo-updates';
import { Chip, ChipText } from '@/components/ui/chip';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export const UPDATE_CHANNELS = ['main', 'preview'] as const;
export type UpdateChannel = (typeof UPDATE_CHANNELS)[number];

const EXPO_UPDATES_URL =
  'https://expo.dev/accounts/iroan/projects/riftrune/updates';

function formatUpdateStamp(value: Date | null | undefined): string {
  if (!value) return 'Embedded build';
  try {
    return value.toLocaleString();
  } catch {
    return value.toISOString();
  }
}

export function UpdateChannelSection() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<UpdateChannel>('main');

  const currentChannel = useMemo(() => {
    const channel = Updates.channel;
    if (channel === 'preview' || channel === 'main') return channel;
    return selectedChannel;
  }, [selectedChannel]);

  useEffect(() => {
    if (Updates.channel === 'preview' || Updates.channel === 'main') {
      setSelectedChannel(Updates.channel);
    }
  }, []);

  const applyChannel = useCallback(async (channel: UpdateChannel) => {
    setSelectedChannel(channel);
    setMessage(null);
    setBusy(true);

    try {
      if (!Updates.isEnabled) {
        setMessage(
          'Update switching needs an EAS Update session. Open a published update from Expo Go, then retry.'
        );
        await Linking.openURL(EXPO_UPDATES_URL);
        return;
      }

      Updates.setUpdateRequestHeadersOverride({
        'expo-channel-name': channel,
      });

      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) {
        setMessage(`No newer ${channel} update for this runtime.`);
        return;
      }

      await Updates.fetchUpdateAsync();
      setMessage(`Loaded ${channel}. Reloading…`);
      await Updates.reloadAsync();
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Update failed';
      setMessage(detail);
      // Fallback: let the collector pick an update QR/list in Expo.
      await Linking.openURL(EXPO_UPDATES_URL);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <View className="gap-3">
      <SectionLabel className="mt-6">App version</SectionLabel>

      <View className="gap-1 rounded-xl border border-border bg-card px-4 py-3">
        <Text className="text-sm font-medium text-foreground">
          Channel: {Updates.channel ?? currentChannel}
        </Text>
        <Text className="text-xs text-muted-foreground">
          Update: {Updates.updateId ?? 'embedded'}
        </Text>
        <Text className="text-xs text-muted-foreground">
          Published: {formatUpdateStamp(Updates.createdAt)}
        </Text>
      </View>

      <Text className="text-sm text-muted-foreground">
        Choose which Expo Update branch to load. Expo Go can also open a specific
        update from the project page.
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {UPDATE_CHANNELS.map((channel) => {
          const selected = currentChannel === channel;
          return (
            <Chip
              key={channel}
              variant={selected ? 'default' : 'outline'}
              disabled={busy}
              onPress={() => {
                void applyChannel(channel);
              }}
            >
              <ChipText className="capitalize">{channel}</ChipText>
            </Chip>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="link"
        className={cn(
          'min-h-11 justify-center rounded-xl border border-border bg-card px-4 py-3',
          busy && 'opacity-60'
        )}
        disabled={busy}
        onPress={() => {
          void Linking.openURL(EXPO_UPDATES_URL);
        }}
      >
        <Text className="text-sm font-medium text-foreground">Browse all updates in Expo</Text>
        <Text className="mt-0.5 text-xs text-muted-foreground">
          Pick any published build from the Expo dashboard
        </Text>
      </Pressable>

      {busy ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator />
          <Text className="text-sm text-muted-foreground">Fetching update…</Text>
        </View>
      ) : null}

      {message ? (
        <Text className="text-sm text-muted-foreground" accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
