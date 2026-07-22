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
import {
  deckEditHref,
  deckViewHref,
  isDeckEditMode,
  leaveDeckEditor,
} from '@/lib/deck-navigation';
import type { DeckCard } from '@/lib/deck-types';
import { hapticPress } from '@/utils/haptics';

type IoMode = 'import' | 'export';

export default function DeckEditorScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const { deck, isLoading, persist, flushSave } = useDeckDetail(id);
  const { importDeck } = useDeckMutations();
  const permanentReadOnly = deck?.readOnly === true;
  const editing = !permanentReadOnly && isDeckEditMode(mode);
  const [ioMode, setIoMode] = useState<IoMode | null>(null);
  const [pickingLegend, setPickingLegend] = useState(false);
  useDeckAutoSave(editing ? deck : null);

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
      if (!isDeckEditMode(mode)) {
        router.replace(deckEditHref(deck.id));
      }
    },
    [deck, mode, persist, router]
  );

  const handleImport = useCallback(() => {
    if (!deck?.id) return;
    void importDeck.mutateAsync(deck.id).then((saved) => {
      router.replace(deckViewHref(saved.id));
    });
  }, [deck?.id, importDeck, router]);

  const handleEdit = useCallback(() => {
    if (!deck?.id) return;
    hapticPress();
    router.push(deckEditHref(deck.id));
  }, [deck?.id, router]);

  const handleBack = useCallback(() => {
    if (editing) {
      void flushSave();
      if (deck?.id) {
        router.replace(deckViewHref(deck.id));
        return;
      }
    }
    leaveDeckEditor(router);
  }, [deck?.id, editing, flushSave, router]);

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

  const needsLegendSetup = !permanentReadOnly && !deck.legend;
  if (pickingLegend || needsLegendSetup) {
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
            permanentReadOnly={permanentReadOnly}
            editing={editing}
            ioMode={ioMode}
            onPersist={persist}
            onIoModeChange={setIoMode}
            onChangeLegend={() => setPickingLegend(true)}
            onEdit={permanentReadOnly || editing ? undefined : handleEdit}
            onImportToMyDecks={permanentReadOnly ? handleImport : undefined}
            importBusy={importDeck.isPending}
            onBack={handleBack}
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
