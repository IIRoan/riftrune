import { ActivityIndicator, Modal, View } from 'react-native';
import { Text } from '@/components/ui/text';

interface DeckImportLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function DeckImportLoadingOverlay({
  visible,
  message = 'Importing deck…',
}: DeckImportLoadingOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-background/80 px-6">
        <View className="w-full max-w-sm items-center gap-4 rounded-2xl border border-border bg-card px-8 py-7 shadow-lg">
          <ActivityIndicator size="large" className="accent-primary" />
          <View className="items-center gap-1">
            <Text className="text-center text-base font-semibold text-foreground">{message}</Text>
            <Text className="text-center text-sm text-muted-foreground">
              Resolving cards and saving your deck
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
