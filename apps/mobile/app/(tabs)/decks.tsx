import { View } from 'react-native';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/text';

export default function DecksScreen() {
  return (
    <ScreenLayout>
      <ScreenHeader title="Decks" />

      <View className="mt-8 rounded-xl border border-dashed border-border px-4 py-20">
        <Text className="text-center text-sm text-muted-foreground">
          Deck building is coming soon.
        </Text>
      </View>
    </ScreenLayout>
  );
}
