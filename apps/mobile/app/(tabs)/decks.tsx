import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function DecksScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-8 pt-4"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}
    >
      <ScreenHeader title="Decks" />

      <Card className="mt-8 border-border bg-card">
        <CardContent className="p-6">
          <Empty className="border-0 p-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Ionicons name="layers-outline" size={28} className="text-primary" />
              </EmptyMedia>
              <EmptyTitle className="text-lg">Coming soon</EmptyTitle>
              <EmptyDescription>
                Build and manage your own decks — stored in our API soon.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
