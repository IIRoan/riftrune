import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useCollectionShareStatus } from '@/hooks/useCollectionShare';

export function SharedCollectionBanner() {
  const statusQuery = useCollectionShareStatus();
  const partner = statusQuery.data?.partner;

  if (!statusQuery.data?.shared || !partner) {
    return null;
  }

  return (
    <View className="mb-4 rounded-xl border border-border bg-card px-4 py-3">
      <Text className="text-sm font-medium text-foreground">
        Shared with {partner.name}
      </Text>
      <Text className="mt-0.5 text-sm text-muted-foreground">
        Changes you make update both collections. Decks stay separate.
      </Text>
    </View>
  );
}
