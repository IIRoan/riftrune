import { Alert, Platform } from 'react-native';

export function confirmRemoveFromCollection(
  cardName: string,
  onConfirm: () => void | Promise<void>
): void {
  const message = `Remove "${cardName}" from your collection?`;

  if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
    if (globalThis.confirm(message)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert('Remove from collection', message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Remove',
      style: 'destructive',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
