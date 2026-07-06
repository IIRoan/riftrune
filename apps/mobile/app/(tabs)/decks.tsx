import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DeckListCard } from '@/components/deck/DeckListCard';
import { ScreenLayout, ScreenLayoutBody } from '@/components/shell/ScreenLayout';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { CalendarPlusIcon } from '@/components/icons';
import { useDeckMutations, useDecks } from '@/hooks/useDecks';
import { hapticPress } from '@/utils/haptics';

export default function DecksScreen() {
  const router = useRouter();
  const { data: decks = [], isLoading } = useDecks();
  const { createNewDeck, removeDeck } = useDeckMutations();

  const handleCreate = useCallback(async () => {
    hapticPress();
    const deck = await createNewDeck.mutateAsync(`Deck ${decks.length + 1}`);
    router.push(`/deck/${deck.id}`);
  }, [createNewDeck, decks.length, router]);

  return (
    <ScreenLayout>
      <ScreenLayoutBody>
        <View className="mb-4 flex-row items-start justify-between gap-3">
          <ScreenHeader
            title="Decks"
            subtitle="Build and validate Riftbound decks"
            className="mb-0 flex-1"
          />
          <Button onPress={() => void handleCreate()} busy={createNewDeck.isPending}>
            <ButtonIcon>
              <CalendarPlusIcon className="size-4 text-primary-foreground" />
            </ButtonIcon>
            <ButtonText>New</ButtonText>
          </Button>
        </View>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator />
          </View>
        ) : decks.length === 0 ? (
          <Empty className="mt-8 border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="mb-1 size-16">
                <ThemedIonicon name="layers-outline" size={32} color="ring" />
              </EmptyMedia>
              <EmptyTitle>No decks yet</EmptyTitle>
              <EmptyDescription>
                Create a deck to add your Legend, Champion, main deck, runes, and battlefields with
                live rules validation.
              </EmptyDescription>
            </EmptyHeader>
            <Button onPress={() => void handleCreate()}>
              <ButtonText>Create your first deck</ButtonText>
            </Button>
          </Empty>
        ) : (
          <View className="gap-3">
            {decks.map((deck) => (
              <DeckListCard
                key={deck.id}
                deck={deck}
                onPress={() => router.push(`/deck/${deck.id}`)}
                onDelete={() => void removeDeck.mutateAsync(deck.id)}
              />
            ))}
          </View>
        )}
      </ScreenLayoutBody>
    </ScreenLayout>
  );
}
