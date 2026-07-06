import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { DeckCardPickerSheet } from '@/components/deck/DeckCardPickerSheet';
import { DeckImportExportSheet } from '@/components/deck/DeckImportExportSheet';
import { DeckSectionList, DeckSectionTabs } from '@/components/deck/DeckSectionList';
import { DeckValidationBanner } from '@/components/deck/DeckValidationBanner';
import { AppShell } from '@/components/shell/AppShell';
import { ScreenLayout, ScreenLayoutBody, useScreenLayout } from '@/components/shell/ScreenLayout';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { useCollection } from '@/hooks/useCollection';
import { useCollectionByCardName } from '@/hooks/useDeckCardResolver';
import { useDeckMutations } from '@/hooks/useDecks';
import type { CollectionEntry } from '@/services/collectionService';
import {
  addCardToDeck,
  changeDeckCardQty,
  removeDeckCard,
} from '@/lib/deck-card';
import type { DeckCard, DeckSectionKey, DeckState } from '@/lib/deck-types';
import { validateDeck } from '@/lib/deck-validation';
import { getDeck } from '@/services/deckStorageService';
import { hapticPress } from '@/utils/haptics';

type IoMode = 'import' | 'export';

export default function DeckEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [deck, setDeck] = useState<DeckState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<DeckSectionKey>('legend');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ioMode, setIoMode] = useState<IoMode | null>(null);
  const { saveDeck } = useDeckMutations();
  const { data: collection = [] } = useCollection();
  const collectionByName = useCollectionByCardName(collection);
  const collectionByVariant = useMemo(
    () => new Map(collection.map((entry) => [entry.variantNumber, entry])),
    [collection]
  );

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!id) return;
      const loaded = await getDeck(id);
      if (mounted) {
        setDeck(loaded);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const persist = useCallback(
    (next: DeckState) => {
      setDeck(next);
      void saveDeck.mutateAsync(next);
    },
    [saveDeck]
  );

  const validation = useMemo(() => (deck ? validateDeck(deck) : []), [deck]);

  const handleAddCard = useCallback(
    (card: DeckCard) => {
      if (!deck) return;
      hapticPress();
      persist(addCardToDeck(deck, card, { section: activeSection }));
    },
    [activeSection, deck, persist]
  );

  if (loading) {
    return (
      <AppShell>
        <ScreenLayout mode="flex">
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        </ScreenLayout>
      </AppShell>
    );
  }

  if (!deck) {
    return (
      <AppShell>
        <ScreenLayout>
          <ScreenLayoutBody>
            <Text className="text-muted-foreground">Deck not found.</Text>
            <Button className="mt-4" onPress={() => router.replace('/(tabs)/decks')}>
              <ButtonText>Back to decks</ButtonText>
            </Button>
          </ScreenLayoutBody>
        </ScreenLayout>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DeckEditorBody
        deck={deck}
        validation={validation}
        activeSection={activeSection}
        pickerOpen={pickerOpen}
        ioMode={ioMode}
        collectionByName={collectionByName}
        collectionByVariant={collectionByVariant}
        onSectionChange={setActiveSection}
        onPickerOpenChange={setPickerOpen}
        onIoModeChange={setIoMode}
        onPersist={persist}
        onAddCard={handleAddCard}
        onBack={() => router.back()}
      />
    </AppShell>
  );
}

function DeckEditorBody(props: {
  deck: DeckState;
  validation: ReturnType<typeof validateDeck>;
  activeSection: DeckSectionKey;
  pickerOpen: boolean;
  ioMode: IoMode | null;
  collectionByName: ReadonlyMap<string, number>;
  collectionByVariant: ReadonlyMap<string, CollectionEntry>;
  onSectionChange: (section: DeckSectionKey) => void;
  onPickerOpenChange: (open: boolean) => void;
  onIoModeChange: (mode: IoMode | null) => void;
  onPersist: (deck: DeckState) => void;
  onAddCard: (card: DeckCard) => void;
  onBack: () => void;
}) {
  return (
    <ScreenLayout mode="flex" contentClassName="min-h-0 flex-1">
      <DeckEditorContent {...props} />
    </ScreenLayout>
  );
}

function DeckEditorContent({
  deck,
  validation,
  activeSection,
  pickerOpen,
  ioMode,
  collectionByName,
  collectionByVariant,
  onSectionChange,
  onPickerOpenChange,
  onIoModeChange,
  onPersist,
  onAddCard,
  onBack,
}: {
  deck: DeckState;
  validation: ReturnType<typeof validateDeck>;
  activeSection: DeckSectionKey;
  pickerOpen: boolean;
  ioMode: IoMode | null;
  collectionByName: ReadonlyMap<string, number>;
  collectionByVariant: ReadonlyMap<string, CollectionEntry>;
  onSectionChange: (section: DeckSectionKey) => void;
  onPickerOpenChange: (open: boolean) => void;
  onIoModeChange: (mode: IoMode | null) => void;
  onPersist: (deck: DeckState) => void;
  onAddCard: (card: DeckCard) => void;
  onBack: () => void;
}) {
  const { paddingBottomInline } = useScreenLayout();

  return (
    <>
      <ScreenLayoutBody className="min-h-0 flex-1 gap-3">
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to decks"
              className="size-9 items-center justify-center rounded-lg active:bg-card-panel"
              onPress={() => {
                hapticPress();
                onBack();
              }}
            >
              <ThemedIonicon name="chevron-back" size={22} color="foreground" />
            </Pressable>
            <View className="min-w-0 flex-1">
              <SearchInput
                value={deck.name}
                onChangeText={(name) =>
                  onPersist({ ...deck, name, updatedAt: Date.now() })
                }
                placeholder="Deck name"
              />
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <Button size="sm" onPress={() => onPickerOpenChange(true)}>
              <ButtonIcon>
                <ThemedIonicon name="add" size={16} color="primary-foreground" />
              </ButtonIcon>
              <ButtonText>Add cards</ButtonText>
            </Button>
            <Button variant="outline" size="sm" onPress={() => onIoModeChange('import')}>
              <ButtonText>Import</ButtonText>
            </Button>
            <Button variant="outline" size="sm" onPress={() => onIoModeChange('export')}>
              <ButtonText>Export</ButtonText>
            </Button>
          </View>
        </View>

        <DeckValidationBanner messages={validation} />

        <DeckSectionTabs
          deck={deck}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />

        <DeckSectionList
          deck={deck}
          activeSection={activeSection}
          collectionByName={collectionByName}
          paddingBottom={paddingBottomInline}
          onBrowseCards={() => onPickerOpenChange(true)}
          onToggleSideboard={() =>
            onPersist({
              ...deck,
              addToSideboard: !deck.addToSideboard,
              updatedAt: Date.now(),
            })
          }
          onRemove={(section, name) => {
            onPersist(removeDeckCard(deck, section, name));
          }}
          onChangeQty={(section, name, delta) => {
            onPersist(changeDeckCardQty(deck, section, name, delta));
          }}
        />
      </ScreenLayoutBody>

      <DeckCardPickerSheet
        open={pickerOpen}
        section={activeSection}
        onClose={() => onPickerOpenChange(false)}
        onSelect={onAddCard}
        collectionByVariant={collectionByVariant}
      />

      {ioMode ? (
        <DeckImportExportSheet
          open
          mode={ioMode}
          deck={deck}
          onClose={() => onIoModeChange(null)}
          onImport={(imported) => onPersist(imported)}
        />
      ) : null}
    </>
  );
}
