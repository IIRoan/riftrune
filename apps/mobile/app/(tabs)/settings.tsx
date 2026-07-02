import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useTheme, type ThemeType } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

const ACCENTS = ['#c89b3c', '#3d9e7a', '#5b6eae', '#b45309', '#16a34a'];

export default function SettingsScreen() {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    defaultLayout,
    setDefaultLayout,
  } = useTheme();
  const insets = useSafeAreaInsets();

  const themes: { label: string; value: ThemeType }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-24 pt-4"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}
    >
      <ScreenHeader title="Settings" />

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
    </ScrollView>
  );
}
