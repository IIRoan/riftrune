import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  DeckBattlefieldPanel,
  DeckSectionGrid,
} from '@/components/deck/DeckSectionGrid';
import { DeckIdentityHeader } from '@/components/deck/DeckIdentityHeader';
import { DeckImportExportSheet } from '@/components/deck/DeckImportExportSheet';
import { DeckViewInfoPanel } from '@/components/deck/DeckViewInfoPanel';
import { DeckLegalityBadge } from '@/components/deck/DeckLegalityBadge';
import {
  DeckBuilderSection,
  DeckBuilderToolbar,
} from '@/components/deck/DeckBuilderToolbar';
import { DeckBuilderStatusStrip } from '@/components/deck/DeckBuilderStatusStrip';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextareaInput } from '@/components/ui/textarea-input';
import { useScreenLayout } from '@/components/shell/ScreenLayout';
import { useMobileLayout } from '@/hooks/useBreakpoint';
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
import { deckHasBannedCards } from '@/lib/card-legality';
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
  const isMobile = useMobileLayout();
  const { paddingBottomInline, contentWidth } = useScreenLayout();
  const [validationExpanded, setValidationExpanded] = useState(false);

  const builderWidth = isMobile ? contentWidth : Math.max(320, (contentWidth - 24) / 2);
  const { tileWidth: sectionTileWidth, gap, numColumns: gridColumns } = useResponsiveColumns(
    'grid',
    { measuredWidth: builderWidth }
  );

  const identityColumnWidth = isMobile ? contentWidth : Math.min(460, contentWidth);
  const identityInnerWidth = Math.max(0, identityColumnWidth - 32);
  const identityPairGap = 12;
  const identityTileWidth = useMemo(() => {
    if (!deck.legend) return identityInnerWidth;
    const pairWidth = Math.floor((identityInnerWidth - identityPairGap) / 2);
    if (isMobile) return pairWidth;
    return Math.min(132, pairWidth);
  }, [deck.legend, identityInnerWidth, isMobile]);

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

  const handleBack = useCallback(() => {
    hapticPress();
    onBack();
  }, [onBack]);

  const identityColumn = (
    <View className="gap-4">
      <DeckBuilderSection>
        <DeckIdentityHeader
          deck={deck}
          readOnly={readOnly}
          legendTileWidth={identityTileWidth}
          imageByVariant={imageByVariant ?? new Map()}
          collectionByName={collectionByName}
          runeCardsByDomain={runeCardsByDomain}
          onChangeLegend={onChangeLegend}
          onAddChampion={() => openAdd('champion')}
          onRemoveChampion={() => onPersist(removeDeckCard(deck, 'champion'))}
          onAdjustRune={handleAdjustRune}
        />
      </DeckBuilderSection>

      <DeckBuilderSection>
        <DeckBattlefieldPanel
          deck={deck}
          readOnly={readOnly}
          imageByVariant={imageByVariant ?? new Map()}
          collectionByName={collectionByName}
          onAdd={() => openAdd('battlefields')}
          onRemove={(name) => onPersist(removeDeckCard(deck, 'battlefields', name))}
        />
      </DeckBuilderSection>
    </View>
  );

  const deckColumn = (
    <View className="gap-4">
      <DeckBuilderSection>
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
      </DeckBuilderSection>

      <DeckBuilderSection>
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
      </DeckBuilderSection>
    </View>
  );

  return (
    <>
      <ScrollView
        className="min-h-0 flex-1"
        contentContainerStyle={{ paddingBottom: paddingBottomInline }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          {readOnly ? (
            <View className="gap-2 rounded-xl border border-border bg-card-panel px-4 py-3">
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

          <DeckBuilderToolbar
            deckName={deck.name}
            readOnly={readOnly}
            validation={validation}
            onBack={handleBack}
            onNameChange={
              readOnly
                ? undefined
                : (name) => onPersist({ ...deck, name, updatedAt: Date.now() })
            }
            onToggleValidation={() => setValidationExpanded((v) => !v)}
            validationExpanded={validationExpanded}
            onImport={readOnly ? undefined : () => onIoModeChange('import')}
            onExport={readOnly ? undefined : () => onIoModeChange('export')}
          />

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

          <DeckBuilderStatusStrip
            deck={deck}
            readOnly={readOnly}
            onSectionPress={(section) => openAdd(section)}
          />

          {isMobile ? (
            <View className="gap-4">
              {identityColumn}
              {deckColumn}
            </View>
          ) : (
            <View className="flex-row items-start gap-4">
              <View className="min-w-0 flex-1" style={{ maxWidth: 460 }}>
                {identityColumn}
              </View>
              <View className="min-w-0 flex-1">{deckColumn}</View>
            </View>
          )}
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
