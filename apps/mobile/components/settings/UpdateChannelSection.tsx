import { Linking, Pressable, View } from 'react-native';
import * as Updates from 'expo-updates';
import { Text } from '@/components/ui/text';

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

function resolveChannelLabel(): string {
  const channel = Updates.channel;
  if (channel === 'preview' || channel === 'main') return channel.toUpperCase();
  if (channel) return channel.toUpperCase();
  return 'MAIN';
}

export function UpdateChannelSection() {
  const updateId = Updates.updateId ?? 'embedded';
  const shortId = updateId.length > 12 ? `${updateId.slice(0, 8)}…` : updateId;

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <View className="flex-row items-stretch">
        <View className="min-w-0 flex-1 gap-1 px-4 py-4">
          <Text className="text-[10px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
            Active
          </Text>
          <Text className="font-mono text-2xl font-bold tabular-nums leading-none text-foreground">
            {resolveChannelLabel()}
          </Text>
        </View>
        <View className="w-hairline self-stretch bg-archive-soft-line" />
        <View className="min-w-0 flex-1 gap-1 px-4 py-4">
          <Text className="text-[10px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
            Update
          </Text>
          <Text
            className="font-mono text-base font-semibold tabular-nums text-foreground"
            numberOfLines={1}
          >
            {shortId}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {formatUpdateStamp(Updates.createdAt)}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => {
          void Linking.openURL(EXPO_UPDATES_URL);
        }}
        className="flex-row items-center justify-between border-t border-border px-4 py-3 active:bg-card-panel"
      >
        <Text className="text-sm font-medium text-foreground">Browse Expo updates</Text>
        <Text className="font-mono text-xs font-bold text-primary">↗</Text>
      </Pressable>
    </View>
  );
}
