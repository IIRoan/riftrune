import { useQuery } from '@tanstack/react-query';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, CardContent } from '@/components/ui/card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/text';
import { api } from '@/src/api/client';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const health = useQuery({ queryKey: ['health'], queryFn: () => api.health() });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-8 pt-4"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}
    >
      <ScreenHeader
        title="Riftbound"
        subtitle="Card catalog with local cache and Cardmarket prices."
      />

      <Card className="mt-6 border-border bg-card">
        <CardContent className="p-4">
          <SectionLabel className="mb-1">API status</SectionLabel>
          <Text className="text-muted-foreground">
            {health.isLoading
              ? 'Checking…'
              : health.isError
                ? 'API unreachable'
                : `DB: ${health.data?.data.db ?? 'unknown'} · Last sync: ${health.data?.data.lastCatalogSync ?? 'never'}`}
          </Text>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
