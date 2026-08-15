import { Linking, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { formatChannelLabel, formatUpdateId } from '@/lib/app-update';
import * as Updates from 'expo-updates';

const EXPO_UPDATES_URL =
  'https://expo.dev/accounts/astralgrove/projects/astral-grove/updates';

function formatUpdateStamp(value: Date | null | undefined): string {
  if (!value) return 'Embedded build';
  try {
    return value.toLocaleString();
  } catch {
    return value.toISOString();
  }
}

function actionLabel(
  enabled: boolean,
  phase: ReturnType<typeof useAppUpdate>['phase']
): string {
  if (!enabled) return 'Updates off in this build';
  if (phase === 'downloading' || phase === 'restarting') return 'Installing…';
  if (phase === 'ready') return 'Restart to apply';
  if (phase === 'available' || phase === 'error') return 'Install update';
  return 'Check for update';
}

export function UpdateChannelSection() {
  const { enabled, action, check, install, restart } = useAppUpdate();
  const updateId = formatUpdateId(Updates.updateId);
  const label = actionLabel(enabled, action);
  const busy = action === 'downloading' || action === 'restarting';

  const onAction = () => {
    if (!enabled || busy) return;
    if (action === 'ready') {
      void restart();
      return;
    }
    if (action === 'available' || action === 'error') {
      void install();
      return;
    }
    void check();
  };

  return (
    <View className="overflow-hidden rounded-[10px] border border-border bg-card">
      <View className="flex-row items-stretch">
        <View className="min-w-0 flex-1 gap-1 px-4 py-4">
          <Text className="text-[10px] font-normal uppercase tracking-[1.4px] text-muted-foreground">
            Active
          </Text>
          <Text className="font-mono text-2xl font-normal tabular-nums leading-none text-foreground">
            {formatChannelLabel(Updates.channel)}
          </Text>
        </View>
        <View className="w-hairline self-stretch bg-archive-soft-line" />
        <View className="min-w-0 flex-1 gap-1 px-4 py-4">
          <Text className="text-[10px] font-normal uppercase tracking-[1.4px] text-muted-foreground">
            Update
          </Text>
          <Text
            className="font-mono text-base font-normal tabular-nums text-foreground"
            numberOfLines={1}
          >
            {updateId}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {formatUpdateStamp(Updates.createdAt)}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !enabled || busy, busy }}
        disabled={!enabled || busy}
        onPress={onAction}
        className="h-11 flex-row items-center justify-between border-t border-border px-4 active:bg-card-panel sm:h-12"
      >
        <Text
          className="text-sm font-medium leading-5 text-foreground"
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text className="font-mono text-xs font-normal text-foreground">
          {action === 'ready' ? '↻' : '↓'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="link"
        onPress={() => {
          void Linking.openURL(EXPO_UPDATES_URL);
        }}
        className="h-11 flex-row items-center justify-between border-t border-border px-4 active:bg-card-panel sm:h-12"
      >
        <Text
          className="text-sm font-medium leading-5 text-foreground"
          numberOfLines={1}
        >
          Browse Expo updates
        </Text>
        <Text className="font-mono text-xs font-normal text-foreground">↗</Text>
      </Pressable>
    </View>
  );
}
