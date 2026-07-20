import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { AppLoader } from '@/components/ui/app-loader';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { useDeckMutations } from '@/hooks/useDecks';
import { leaveDeckEditor } from '@/lib/deck-navigation';

/** Creates a deck immediately and jumps into the builder (legend picker). */
export default function DeckCreateScreen() {
  const router = useRouter();
  const { createNewDeck } = useDeckMutations();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void createNewDeck
      .mutateAsync({})
      .then((deck) => {
        router.replace(`/decks/${deck.id}`);
      })
      .catch(() => {
        startedRef.current = false;
        leaveDeckEditor(router);
      });
  }, [createNewDeck, router]);

  return (
    <ScreenLayout mode="flex">
      <View className="flex-1 items-center justify-center">
        <AppLoader size="md" />
      </View>
    </ScreenLayout>
  );
}
