import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppLoadingScreen } from '@/components/ui/app-loader';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { useDeckMutations } from '@/hooks/useDecks';
import { enterCreatedDeckEditor, leaveDeckEditor } from '@/lib/deck-navigation';

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
        enterCreatedDeckEditor(router, deck.id);
      })
      .catch(() => {
        startedRef.current = false;
        leaveDeckEditor(router);
      });
  }, [createNewDeck, router]);

  return (
    <ScreenLayout mode="flex">
      <AppLoadingScreen size="md" className="bg-transparent" />
    </ScreenLayout>
  );
}
