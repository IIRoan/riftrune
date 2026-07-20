import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AppLoader } from '@/components/ui/app-loader';
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
import { leaveDeckEditor } from '@/lib/deck-navigation';
import type { DeckCard } from '@/lib/deck-types';

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
          <AppLoader size="md" />
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
        onSelect={handleLegendSelect}
        onBack={() => {
          if (deck.legend) {
            setPickingLegend(false);
            return;
          }
          leaveDeckEditor(router);
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
              leaveDeckEditor(router);
            }}
          />
        </ScreenLayoutBody>
      </ScreenLayout>
    </>
  );
}

function LegendPickerScreen({
  onSelect,
  onBack,
}: {
  onSelect: (legend: DeckCard) => void;
  onBack: () => void;
}) {
  return (
    <ScreenLayout mode="flex" contentClassName="min-h-0 flex-1">
      <LegendPickerScreenBody onSelect={onSelect} onBack={onBack} />
    </ScreenLayout>
  );
}

function LegendPickerScreenBody({
  onSelect,
  onBack,
}: {
  onSelect: (legend: DeckCard) => void;
  onBack: () => void;
}) {
  const { paddingBottomInline } = useScreenLayout();

  return (
    <ScreenLayoutBody className="min-h-0 flex-1">
      <LegendPicker
        onSelect={onSelect}
        onBack={onBack}
        paddingBottom={paddingBottomInline}
      />
    </ScreenLayoutBody>
  );
}
