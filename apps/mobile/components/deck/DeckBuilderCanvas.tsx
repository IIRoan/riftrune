import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  DeckBattlefieldRow,
  DeckSectionGrid,
} from '@/components/deck/DeckSectionGrid';
import { DeckIdentityHeader } from '@/components/deck/DeckIdentityHeader';
import { DeckImportExportSheet } from '@/components/deck/DeckImportExportSheet';
import { DeckValidationBanner } from '@/components/deck/DeckValidationBanner';
import { DeckViewInfoPanel } from '@/components/deck/DeckViewInfoPanel';
import { DeckLegalityBadge } from '@/components/deck/DeckLegalityBadge';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Text } from '@/components/ui/text';
import { TextareaInput } from '@/components/ui/textarea-input';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { useScreenLayout } from '@/components/shell/ScreenLayout';
import { useCollection } from '@/hooks/useCollection';
import { useCollectionByCardName } from '@/hooks/useDeckCardResolver';
import { useDeckCardImages } from '@/hooks/useDeckCardImages';
import { useLegendRuneCards } from '@/hooks/useLegendRuneCards';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
  changeDeckCardQty,
  deckVariantNumbersKey,
  removeDeckCard,
} from '@/lib/deck-card';
import { adjustRuneCountForDomain, seedDefaultRuneSplit } from '@/lib/deck-runes';
import type { DeckSectionKey, DeckState } from '@/lib/deck-types';
import { validateDeck } from '@/lib/deck-validation';
import { deckHasBannedCards } from '@/lib/deck-browse';
import { prefetchDeckAddCatalog } from '@/lib/prefetchDeckAddCatalog';
import { hapticPress } from '@/utils/haptics';

type IoMode = 'import' | 'export';

interface DeckBuilderCanvasProps {
  deck: DeckState;
  readOnly?: boolean;
  ioMode: IoMode | null;
  onPersist: (
    deck: DeckState | ((previous: DeckState) => DeckState),
    options?: { immediate?: boolean }
  ) => void;
  onIoModeChange: (mode: IoMode | null) => void;
  onChangeLegend: () => void;
  onBack: () => void;
  onImportToMyDecks?: () => void;
  importBusy?: boolean;
}

export function DeckBuilderCanvas({
  deck,
  readOnly = false,
  ioMode,
  onPersist,
  onIoModeChange,
  onChangeLegend,
  onBack,
  onImportToMyDecks,
  importBusy = false,
}: DeckBuilderCanvasProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { paddingBottomInline, contentWidth } = useScreenLayout();
  const { tileWidth: sectionTileWidth, gap, numColumns: gridColumns } = useResponsiveColumns(
    'grid',
    { measuredWidth: contentWidth }
  );
  const identityTileWidth = sectionTileWidth;

  const { data: collection = [] } = useCollection();
  const collectionByName = useCollectionByCardName(collection);
  const validation = useMemo(() => validateDeck(deck), [deck]);

  const variantKey = deckVariantNumbersKey(deck);
  const { data: imageByVariant } = useDeckCardImages(variantKey);
  const { data: runeCards } = useLegendRuneCards(deck.legend);
  const runeCardsByDomain = runeCards?.byDomain ?? new Map();
  const seededRunesForLegendRef = useRef<string | null>(null);

  useEffect(() => {
    if (readOnly) return;
    if (!deck.legend || deck.runes.size > 0 || runeCardsByDomain.size === 0) return;
    const seedKey = `${deck.id}:${deck.legend.variantNumber}`;
    if (seededRunesForLegendRef.current === seedKey) return;

    const seeded = seedDefaultRuneSplit(deck, runeCardsByDomain);
    if (seeded.runes.size === 0) return;

    seededRunesForLegendRef.current = seedKey;
    onPersist(seeded);
  }, [deck, onPersist, readOnly, runeCardsByDomain]);

  const openAdd = useCallback(
    (section: DeckSectionKey) => {
      if (readOnly) return;
      hapticPress();
      void prefetchDeckAddCatalog(queryClient, deck, section);
      router.push(`/decks/${deck.id}/add?section=${section}`);
    },
    [deck, queryClient, readOnly, router]
  );

  const handleAdjustRune = useCallback(
    (domain: string, delta: number) => {
      if (readOnly) return;
      const runeCard = runeCardsByDomain.get(domain) ?? null;
      onPersist(adjustRuneCountForDomain(deck, domain, delta, runeCard));
    },
    [deck, onPersist, readOnly, runeCardsByDomain]
  );

  return (
    <>
      <ScrollView
        className="min-h-0 flex-1"
        contentContainerStyle={{ paddingBottom: paddingBottomInline }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-5">
          {readOnly ? (
            <View className="gap-2 rounded-xl border border-archive-soft-line bg-card-panel px-3 py-2.5">
              <Text className="text-sm text-muted-foreground">
                Imported from Piltover Archive — view only
              </Text>
              {onImportToMyDecks ? (
                <Button
                  className="w-auto self-start"
                  busy={importBusy}
                  disabled={importBusy}
                  onPress={onImportToMyDecks}
                >
                  <ButtonText>{importBusy ? 'Importing…' : 'Import to my decks'}</ButtonText>
                </Button>
              ) : null}
            </View>
          ) : null}

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
                {readOnly ? (
                  <Text className="text-lg font-semibold text-foreground">{deck.name}</Text>
                ) : (
                  <TextInput
                    value={deck.name}
                    onChangeText={(name) =>
                      onPersist({ ...deck, name, updatedAt: Date.now() })
                    }
                    placeholder="Deck name"
                  />
                )}
              </View>
            </View>

            {readOnly ? (
              <DeckViewInfoPanel deck={deck} />
            ) : (
              <>
                <TextareaInput
                  value={deck.description}
                  onChangeText={(description) =>
                    onPersist({ ...deck, description, updatedAt: Date.now() })
                  }
                  placeholder="Deck description (optional)"
                />
                {deckHasBannedCards(deck) ? (
                  <View className="self-start">
                    <DeckLegalityBadge isLegal={false} />
                  </View>
                ) : null}
              </>
            )}

            {readOnly ? null : (
              <View className="flex-row flex-wrap gap-2">
                <Button variant="outline" size="sm" onPress={() => onIoModeChange('import')}>
                  <ButtonText>Import</ButtonText>
                </Button>
                <Button variant="outline" size="sm" onPress={() => onIoModeChange('export')}>
                  <ButtonText>Export</ButtonText>
                </Button>
                <Button
                  variant={deck.addToSideboard ? 'default' : 'outline'}
                  size="sm"
                  onPress={() =>
                    onPersist({
                      ...deck,
                      addToSideboard: !deck.addToSideboard,
                      updatedAt: Date.now(),
                    })
                  }
                >
                  <ButtonIcon>
                    <ThemedIonicon
                      name={deck.addToSideboard ? 'swap-horizontal' : 'albums-outline'}
                      size={14}
                      color={deck.addToSideboard ? 'primary-foreground' : 'foreground'}
                    />
                  </ButtonIcon>
                  <ButtonText>
                    {deck.addToSideboard ? 'Adding to sideboard' : 'Add to sideboard'}
                  </ButtonText>
                </Button>
              </View>
            )}
          </View>

          <DeckValidationBanner messages={validation} />

          <DeckIdentityHeader
            deck={deck}
            readOnly={readOnly}
            legendTileWidth={identityTileWidth}
            championTileWidth={identityTileWidth}
            imageByVariant={imageByVariant ?? new Map()}
            collectionByName={collectionByName}
            runeCardsByDomain={runeCardsByDomain}
            onChangeLegend={onChangeLegend}
            onAddChampion={() => openAdd('champion')}
            onRemoveChampion={() => onPersist(removeDeckCard(deck, 'champion'))}
            onAdjustRune={handleAdjustRune}
          />

          <View className="h-px bg-archive-soft-line" />

          <DeckBattlefieldRow
            deck={deck}
            readOnly={readOnly}
            tileWidth={sectionTileWidth}
            gap={gap}
            imageByVariant={imageByVariant ?? new Map()}
            collectionByName={collectionByName}
            onAdd={() => openAdd('battlefields')}
            onRemove={(name) => onPersist(removeDeckCard(deck, 'battlefields', name))}
          />

          <View className="h-px bg-archive-soft-line" />

          <DeckSectionGrid
            deck={deck}
            section="mainDeck"
            readOnly={readOnly}
            title="Main deck"
            tileWidth={sectionTileWidth}
            gap={gap}
            gridColumns={gridColumns}
            imageByVariant={imageByVariant ?? new Map()}
            collectionByName={collectionByName}
            onAdd={() => openAdd('mainDeck')}
            onMinus={(name) =>
              onPersist((prev) => changeDeckCardQty(prev, 'mainDeck', name, -1), { immediate: true })
            }
            onPlus={(name) =>
              onPersist((prev) => changeDeckCardQty(prev, 'mainDeck', name, 1), { immediate: true })
            }
            onRemove={(name) =>
              onPersist((prev) => removeDeckCard(prev, 'mainDeck', name), { immediate: true })
            }
          />

          <DeckSectionGrid
            deck={deck}
            section="sideboard"
            readOnly={readOnly}
            title="Sideboard"
            tileWidth={sectionTileWidth}
            gap={gap}
            gridColumns={gridColumns}
            imageByVariant={imageByVariant ?? new Map()}
            collectionByName={collectionByName}
            onAdd={() => openAdd('sideboard')}
            onMinus={(name) => onPersist(changeDeckCardQty(deck, 'sideboard', name, -1))}
            onPlus={(name) => onPersist(changeDeckCardQty(deck, 'sideboard', name, 1))}
            onRemove={(name) => onPersist(removeDeckCard(deck, 'sideboard', name))}
          />
        </View>
      </ScrollView>

      {ioMode && !readOnly ? (
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
