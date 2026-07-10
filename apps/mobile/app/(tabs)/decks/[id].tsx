import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DeckBuilderCanvas } from '@/components/deck/DeckBuilderCanvas';
import { DeckImportLoadingOverlay } from '@/components/deck/DeckImportLoadingOverlay';
import { LegendPicker } from '@/components/deck/LegendPicker';
import { ScreenLayout, ScreenLayoutBody, useScreenLayout } from '@/components/shell/ScreenLayout';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useDeckAutoSave } from '@/hooks/useDeckAutoSave';
import { useDeckDetail } from '@/hooks/useDeckDetail';
import { useDeckMutations } from '@/hooks/useDecks';
import { addCardToDeck } from '@/lib/deck-card';
import type { DeckCard, DeckState } from '@/lib/deck-types';

type IoMode = 'import' | 'export';

export default function DeckEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deck, isLoading, persist, flushSave } = useDeckDetail(id);
  const { importDeck } = useDeckMutations();
  const readOnly = deck?.readOnly === true;
  const [ioMode, setIoMode] = useState<IoMode | null>(null);
  const [pickingLegend, setPickingLegend] = useState(false);
  useDeckAutoSave(readOnly ? null : deck);

  const handleLegendSelect = useCallback(
    (legend: DeckCard) => {
      if (!deck) return;
      const next = addCardToDeck(
        { ...deck, legend: null, champion: null, runes: new Map() },
        legend,
        { section: 'legend' }
      );
      setPickingLegend(false);
      persist(next);
    },
    [deck, persist]
  );

  const handleImport = useCallback(() => {
    if (!deck?.id) return;
    void importDeck.mutateAsync(deck.id).then((saved) => {
      router.replace(`/decks/${saved.id}`);
    });
  }, [deck?.id, importDeck, router]);

  if (isLoading) {
    return (
      <ScreenLayout mode="flex">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </ScreenLayout>
    );
  }

  if (!deck) {
    return (
      <ScreenLayout>
        <ScreenLayoutBody>
          <Text className="text-muted-foreground">Deck not found.</Text>
          <Button className="mt-4" onPress={() => router.replace('/decks')}>
            <ButtonText>Back to decks</ButtonText>
          </Button>
        </ScreenLayoutBody>
      </ScreenLayout>
    );
  }

  if (pickingLegend || (!readOnly && !deck.legend)) {
    return (
      <LegendPickerScreen
        deck={deck}
        onSelect={handleLegendSelect}
        onBack={() => {
          if (deck.legend) {
            setPickingLegend(false);
            return;
          }
          router.back();
        }}
      />
    );
  }

  return (
    <>
      <DeckImportLoadingOverlay
        visible={importDeck.isPending}
        message="Importing deck to your collection…"
      />
      <ScreenLayout mode="flex" contentClassName="min-h-0 flex-1">
        <ScreenLayoutBody className="min-h-0 flex-1">
          <DeckBuilderCanvas
            deck={deck}
            readOnly={readOnly}
            ioMode={ioMode}
            onPersist={persist}
            onIoModeChange={setIoMode}
            onChangeLegend={() => setPickingLegend(true)}
            onImportToMyDecks={readOnly ? handleImport : undefined}
            importBusy={importDeck.isPending}
            onBack={() => {
              if (!readOnly) void flushSave();
              router.back();
            }}
          />
        </ScreenLayoutBody>
      </ScreenLayout>
    </>
  );
}

function LegendPickerScreen({
  deck,
  onSelect,
  onBack,
}: {
  deck: DeckState;
  onSelect: (legend: DeckCard) => void;
  onBack: () => void;
}) {
  return (
    <ScreenLayout mode="flex" contentClassName="min-h-0 flex-1">
      <LegendPickerScreenBody deck={deck} onSelect={onSelect} onBack={onBack} />
    </ScreenLayout>
  );
}

function LegendPickerScreenBody({
  deck,
  onSelect,
  onBack,
}: {
  deck: DeckState;
  onSelect: (legend: DeckCard) => void;
  onBack: () => void;
}) {
  const { paddingBottomInline } = useScreenLayout();

  return (
    <ScreenLayoutBody className="min-h-0 flex-1 gap-3">
      <View className="gap-1">
        <Text className="text-base font-semibold text-foreground">{deck.name}</Text>
        {deck.description ? (
          <Text className="text-[13px] text-muted-foreground">{deck.description}</Text>
        ) : null}
      </View>
      <LegendPicker
        onSelect={onSelect}
        onBack={onBack}
        paddingBottom={paddingBottomInline}
      />
    </ScreenLayoutBody>
  );
}
