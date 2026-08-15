import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppUpdateDispatch } from '@/components/settings/AppUpdateScreen';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { AppUpdatePhase } from '@/lib/app-update';

const PHASES: AppUpdatePhase[] = ['available', 'downloading', 'ready', 'error'];

function nextPhase(phase: AppUpdatePhase): AppUpdatePhase {
  if (phase === 'available' || phase === 'error') return 'downloading';
  if (phase === 'downloading') return 'ready';
  if (phase === 'ready') return 'restarting';
  return 'available';
}

/** Design playground: the update dispatch at real phone scale. */
export default function UpdatePreviewScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<AppUpdatePhase>('available');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase !== 'downloading') {
      setProgress(phase === 'ready' ? 1 : 0);
      return;
    }
    setProgress(0);
    const id = setInterval(() => {
      setProgress((current) => {
        const next = Math.round((current + 0.04) * 100) / 100;
        return next >= 1 ? 0 : next;
      });
    }, 80);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'restarting') return;
    const timer = setTimeout(() => setPhase('available'), 1400);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <AppUpdateDispatch
      phase={phase}
      channelLabel="PREVIEW"
      downloadProgress={phase === 'downloading' ? progress : undefined}
      errorMessage="The download did not finish. Try again."
      onPrimary={() => setPhase(nextPhase(phase))}
      onSecondary={() => router.back()}
      header={
        <View className="mb-4 w-full max-w-[400px] self-center">
          <View className="flex-row flex-wrap gap-2">
            {PHASES.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`Show ${item} state`}
                onPress={() => setPhase(item)}
                className={cn(
                  'rounded-[3px] border px-3 py-2',
                  phase === item
                    ? 'border-foreground bg-card-panel'
                    : 'border-border bg-card'
                )}
              >
                <Text
                  className={cn(
                    'font-mono text-[11px] uppercase tracking-wide',
                    phase === item ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      }
    />
  );
}
