import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { AppearanceSpecimens } from '@/components/settings/AppearanceSpecimens';
import { SharedCollectionSection } from '@/components/settings/SharedCollectionSection';
import { UpdateChannelSection } from '@/components/settings/UpdateChannelSection';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/text';
import { useShowSideRail } from '@/hooks/useBreakpoint';
import { authClient } from '@/src/lib/auth-client';
import { cn } from '@/lib/utils';

function SettingsSection({
  label,
  children,
  className,
  fill,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  /** Stretch panel to match sibling height in a desktop row. */
  fill?: boolean;
}) {
  return (
    <View className={cn('gap-2', fill && 'min-h-0 min-w-0 flex-1 flex-col', className)}>
      <SectionLabel className="mb-0">{label}</SectionLabel>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const sessionQuery = authClient.useSession();
  const signedIn = Boolean(sessionQuery.data?.user);
  const showRail = useShowSideRail();
  const accountShareRow = signedIn && showRail;

  return (
    <ScreenLayout>
      <ScreenHeader title="Settings" />

      <View className="mt-6 gap-8">
        <View className={cn(accountShareRow ? 'flex-row items-stretch gap-4' : 'gap-8')}>
          <SettingsSection label="Account" fill={accountShareRow}>
            <AuthPanel className={accountShareRow ? 'min-h-0 flex-1' : undefined} />
          </SettingsSection>

          {signedIn ? (
            <SettingsSection label="Shared collection" fill={accountShareRow}>
              <SharedCollectionSection
                className={accountShareRow ? 'min-h-0 flex-1' : undefined}
              />
            </SettingsSection>
          ) : null}
        </View>

        <SettingsSection label="Display">
          <AppearanceSpecimens />
        </SettingsSection>

        <SettingsSection label="App version">
          <UpdateChannelSection />
        </SettingsSection>

        {__DEV__ ? (
          <SettingsSection label="Design">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Rift Channel loader preview"
              onPress={() => router.push('/loading')}
              className="flex-row items-center justify-between gap-3 overflow-hidden rounded-xl border border-border bg-card active:border-ring"
            >
              <View className="min-w-0 flex-1 gap-1 px-4 py-3">
                <Text className="text-sm font-semibold text-foreground">Rune charge loader</Text>
                <Text className="font-mono text-[11px] text-muted-foreground">/loading</Text>
              </View>
              <View className="h-full w-14 items-center justify-center border-l border-border bg-card-panel py-3">
                <Text className="font-mono text-xs font-bold text-primary">→</Text>
              </View>
            </Pressable>
          </SettingsSection>
        ) : null}
      </View>
    </ScreenLayout>
  );
}
