import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { UpdateChannelSection } from '@/components/settings/UpdateChannelSection';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { Chip, ChipText } from '@/components/ui/chip';
import {
  Choicebox,
  ChoiceboxItem,
  ChoiceboxItemDescription,
  ChoiceboxItemHeader,
  ChoiceboxItemTitle,
} from '@/components/ui/choicebox';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { useTheme, type ThemeType } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

const ACCENTS = ['#efffcc', '#5ecf8a', '#b8b8b8', '#c9a227', '#f5f5f5'];

export default function SettingsScreen() {
  const router = useRouter();
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    defaultLayout,
    setDefaultLayout,
  } = useTheme();

  const themes: { label: string; value: ThemeType }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  return (
    <ScreenLayout>
      <ScreenHeader title="Settings" />

      <SectionLabel className="mt-2">Account</SectionLabel>
      <AuthPanel />

      <UpdateChannelSection />

      <SectionLabel className="mt-6">Theme</SectionLabel>
      <Stack direction="row" className="flex-wrap gap-2">
        {themes.map((t) => (
          <Chip
            key={t.value}
            variant={theme === t.value ? 'default' : 'outline'}
            onPress={() => {
              setTheme(t.value);
            }}
          >
            <ChipText>{t.label}</ChipText>
          </Chip>
        ))}
      </Stack>

      <SectionLabel className="mt-6">Accent</SectionLabel>
      <Stack direction="row" className="flex-wrap gap-2">
        {ACCENTS.map((c) => (
          <Pressable
            key={c}
            className={cn(
              'size-9 rounded-full',
              accentColor === c && 'border-[3px] border-foreground'
            )}
            style={{ backgroundColor: c }}
            onPress={() => {
              setAccentColor(c);
            }}
          />
        ))}
      </Stack>

      <SectionLabel className="mt-6">Search layout</SectionLabel>
      <Choicebox
        type="single"
        value={defaultLayout}
        onValueChange={(value) => {
          if (value === 'grid' || value === 'list') {
            setDefaultLayout(value);
          }
        }}
        direction="row"
        className="gap-2"
      >
        {(['list', 'grid'] as const).map((layout) => (
          <ChoiceboxItem key={layout} value={layout} className="min-w-[120px] flex-1">
            <ChoiceboxItemHeader>
              <ChoiceboxItemTitle className="capitalize">{layout}</ChoiceboxItemTitle>
              <ChoiceboxItemDescription>
                {layout === 'grid' ? 'Thumbnail grid' : 'Detailed rows'}
              </ChoiceboxItemDescription>
            </ChoiceboxItemHeader>
          </ChoiceboxItem>
        ))}
      </Choicebox>

      {__DEV__ ? (
        <>
          <SectionLabel className="mt-6">Design</SectionLabel>
          <Pressable
            onPress={() => router.push('/loading')}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <Text className="text-sm font-medium text-foreground">Rift Channel loader</Text>
            <Text className="mt-0.5 text-sm text-muted-foreground">Open /loading preview</Text>
          </Pressable>
        </>
      ) : null}
    </ScreenLayout>
  );
}
