import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AppShell } from '@/components/shell/AppShell';
import { ScreenLayout, ScreenLayoutBody } from '@/components/shell/ScreenLayout';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button, ButtonText } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { useDeckMutations } from '@/hooks/useDecks';
import { hapticPress } from '@/utils/haptics';

export default function DeckCreateScreen() {
  const router = useRouter();
  const { createNewDeck } = useDeckMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = useCallback(async () => {
    hapticPress();
    const trimmed = name.trim() || 'Untitled deck';
    const deck = await createNewDeck.mutateAsync({
      name: trimmed,
      description: description.trim(),
    });
    router.replace(`/deck/${deck.id}`);
  }, [createNewDeck, description, name, router]);

  return (
    <AppShell>
      <ScreenLayout>
        <ScreenLayoutBody>
          <ScreenHeader
            title="New deck"
            subtitle="Name your deck, then choose a Legend to begin building."
            className="mb-6"
          />

          <View className="gap-4">
            <View className="gap-2">
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Deck name"
                autoFocus
              />
            </View>

            <View className="gap-2">
              <TextareaInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description (strategy notes, matchup plans, etc.)"
              />
            </View>

            <View className="flex-row flex-wrap gap-2 pt-2">
              <Button onPress={() => void handleCreate()} busy={createNewDeck.isPending}>
                <ButtonText>Create deck</ButtonText>
              </Button>
              <Button variant="outline" onPress={() => router.back()}>
                <ButtonText>Cancel</ButtonText>
              </Button>
            </View>
          </View>
        </ScreenLayoutBody>
      </ScreenLayout>
    </AppShell>
  );
}
