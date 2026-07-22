import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DeckBuilderInfoDrawer,
  DECK_INFO_DRAWER_WIDTH,
} from '@/components/deck/DeckBuilderInfoDrawer';
import {
  DeckCompositionList,
  DECK_COMPOSITION_LIST_WIDTH,
} from '@/components/deck/DeckCompositionList';
import { DeckBuilderCatalogPanel } from '@/components/deck/DeckBuilderCatalogPanel';
import { DeckImportExportSheet } from '@/components/deck/DeckImportExportSheet';
import { DeckBuilderToolbar } from '@/components/deck/DeckBuilderToolbar';
import { DeckShowcasePanel } from '@/components/deck/DeckShowcasePanel';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
} from '@/components/ui/bottom-sheet';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { useScreenLayout } from '@/components/shell/ScreenLayout';
import type { CatalogFilters } from '@/constants/catalogFilters';
import type { PillNavItem } from '@/components/shell/FloatingPillNav';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import { useCollection } from '@/hooks/useCollection';
import { useCollectionByCardName } from '@/hooks/useDeckCardResolver';
import { useDeckCardImages } from '@/hooks/useDeckCardImages';
import { useLegendRuneCards } from '@/hooks/useLegendRuneCards';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import {
  changeDeckCardQty,
  deckVariantNumbersKey,
  removeDeckCard,
} from '@/lib/deck-card';
import { deckSectionProgress } from '@/lib/deck-display';
import { adjustRuneCountForDomain, seedDefaultRuneSplit } from '@/lib/deck-runes';
import type { DeckSectionKey, DeckState } from '@/lib/deck-types';
import { validateDeck } from '@/lib/deck-validation';
import { prefetchDeckAddCatalog } from '@/lib/prefetchDeckAddCatalog';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

type IoMode = 'import' | 'export';
type MobilePanel = 'info' | 'list' | null;
type CatalogSection = 'mainDeck' | 'sideboard';

interface DeckBuilderCanvasProps {
  deck: DeckState;
  /** Permanent upstream import — never editable in place. */
  permanentReadOnly?: boolean;
  /** UI mode: gallery vs builder. Forced off when permanentReadOnly. */
  editing?: boolean;
  ioMode: IoMode | null;
  onPersist: (
    deck: DeckState | ((previous: DeckState) => DeckState),
    options?: { immediate?: boolean }
  ) => void;
  onIoModeChange: (mode: IoMode | null) => void;
  onChangeLegend: () => void;
  onBack: () => void;
  onEdit?: () => void;
  onImportToMyDecks?: () => void;
  importBusy?: boolean;
}

export function DeckBuilderCanvas({
  deck,
  permanentReadOnly = false,
  editing = false,
  ioMode,
  onPersist,
  onIoModeChange,
  onChangeLegend,
  onBack,
  onEdit,
  onImportToMyDecks,
  importBusy = false,
}: DeckBuilderCanvasProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useMobileLayout();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { paddingBottomInline } = useScreenLayout();
  const readOnly = permanentReadOnly || !editing;
  const [validationExpanded, setValidationExpanded] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [catalogSection, setCatalogSection] = useState<CatalogSection>('mainDeck');
  const [mobileFilterChrome, setMobileFilterChrome] = useState<{
    filters: CatalogFilters;
    onOpen: () => void;
  } | null>(null);

  const handleMobileFilterChromeChange = useCallback(
    (chrome: { filters: CatalogFilters; onOpen: () => void } | null) => {
      setMobileFilterChrome(chrome);
    },
    []
  );

  const { data: collection = [] } = useCollection();
  const collectionByName = useCollectionByCardName(collection);
  const validation = useMemo(() => validateDeck(deck), [deck]);

  const variantKey = deckVariantNumbersKey(deck);
  const { data: imageByVariant } = useDeckCardImages(variantKey);
  const images = imageByVariant ?? new Map<string, string>();
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

  const focusCatalogSection = useCallback((section: CatalogSection) => {
    hapticPress();
    setCatalogSection(section);
    setMobilePanel(null);
  }, []);

  /** Champion / battlefields still use the dedicated add screen; main/side stay inline. */
  const openSpecialAdd = useCallback(
    (section: DeckSectionKey) => {
      if (readOnly) return;
      if (section === 'mainDeck' || section === 'sideboard') {
        focusCatalogSection(section);
        return;
      }
      if (section === 'runes') {
        if (isMobile) setMobilePanel('info');
        else setInfoDrawerOpen(true);
        return;
      }
      hapticPress();
      setMobilePanel(null);
      void prefetchDeckAddCatalog(queryClient, deck, section);
      router.push(`/decks/${deck.id}/add?section=${section}`);
    },
    [deck, focusCatalogSection, isMobile, queryClient, readOnly, router]
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

  const sheetPaddingBottom = Math.max(insets.bottom, 16) + 24;

  const infoDrawer = (
    <DeckBuilderInfoDrawer
      deck={deck}
      readOnly={readOnly}
      imageByVariant={images}
      collectionByName={collectionByName}
      runeCardsByDomain={runeCardsByDomain}
      onChangeLegend={onChangeLegend}
      onAddChampion={() => openSpecialAdd('champion')}
      onRemoveChampion={() => onPersist(removeDeckCard(deck, 'champion'))}
      onAdjustRune={handleAdjustRune}
      onAddBattlefield={() => openSpecialAdd('battlefields')}
      onRemoveBattlefield={(name) =>
        onPersist((prev) => removeDeckCard(prev, 'battlefields', name), { immediate: true })
      }
      onDescriptionChange={
        readOnly
          ? undefined
          : (description) => onPersist({ ...deck, description, updatedAt: Date.now() })
      }
      paddingBottom={paddingBottomInline}
      scrollEnabled={!isMobile}
    />
  );

  const compositionList = (
    <DeckCompositionList
      deck={deck}
      readOnly={readOnly}
      imageByVariant={images}
      collectionByName={collectionByName}
      openSource={readOnly ? 'deck-view' : undefined}
      onMinus={(section, name) =>
        onPersist((prev) => changeDeckCardQty(prev, section, name, -1), { immediate: true })
      }
      onPlus={(section, name) =>
        onPersist((prev) => changeDeckCardQty(prev, section, name, 1), { immediate: true })
      }
      onRemove={(section, name) => {
        if (section === 'legend') {
          onChangeLegend();
          return;
        }
        onPersist((prev) => removeDeckCard(prev, section, name), { immediate: true });
      }}
      onAddSection={(section) => openSpecialAdd(section)}
      onSectionPress={(section) => openSpecialAdd(section)}
      paddingBottom={isMobile ? sheetPaddingBottom : paddingBottomInline}
      bordered={false}
    />
  );

  const catalogPanel = (
    <DeckBuilderCatalogPanel
      deck={deck}
      readOnly={false}
      collectionByName={collectionByName}
      onPersist={onPersist}
      section={catalogSection}
      onSectionChange={setCatalogSection}
      paddingBottom={paddingBottomInline}
      onMobileFilterChromeChange={handleMobileFilterChromeChange}
    />
  );

  const showcasePanel = (
    <DeckShowcasePanel
      deck={deck}
      imageByVariant={images}
      collectionByName={collectionByName}
      runeCardsByDomain={runeCardsByDomain}
      paddingBottom={paddingBottomInline}
    />
  );

  const browseSectionNavItems = useMemo((): readonly PillNavItem<CatalogSection>[] => {
    const main = deckSectionProgress(deck, 'mainDeck');
    const side = deckSectionProgress(deck, 'sideboard');
    return [
      {
        id: 'mainDeck',
        label: 'Main',
        accessibilityLabel: `Main deck ${main.current} of ${main.target}`,
        icon: 'layers-outline',
        iconActive: 'layers',
        badge: `${main.current}/${main.target}`,
      },
      {
        id: 'sideboard',
        label: 'Side',
        accessibilityLabel: `Sideboard ${side.current} of ${side.target}`,
        icon: 'file-tray-outline',
        iconActive: 'file-tray',
        badge: `${side.current}/${side.target}`,
      },
    ];
  }, [deck]);

  const mobileSnapPoints = reduceMotion ? ['92%'] : ['72%', '92%'];
  const showImportedBanner = permanentReadOnly;
  const canEdit = !permanentReadOnly && Boolean(onEdit);

  return (
    <>
      <View className="relative min-h-0 flex-1 gap-3">
        {showImportedBanner ? (
          <View className="flex-row items-center gap-2 border-b border-border pb-2.5">
            <StatusKeywordBadge status="imported" compact />
            <Text className="min-w-0 flex-1 text-[12px] text-muted-foreground" numberOfLines={1}>
              View only · from Piltover Archive
            </Text>
            {onImportToMyDecks ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={importBusy ? 'Importing deck' : 'Import to my decks'}
                accessibilityState={{ disabled: importBusy, busy: importBusy }}
                disabled={importBusy}
                className={cn(
                  'flex-row items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5',
                  importBusy ? 'opacity-50' : 'active:bg-card-panel'
                )}
                onPress={() => {
                  hapticPress();
                  onImportToMyDecks();
                }}
              >
                <ThemedIonicon name="download-outline" size={14} color="primary" />
                <Text className="text-[12px] font-semibold text-primary">
                  {importBusy ? 'Importing…' : 'Import'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <DeckBuilderToolbar
          deckName={deck.name}
          readOnly={readOnly}
          validation={validation}
          onBack={handleBack}
          backAccessibilityLabel={readOnly ? 'Back to decks' : 'Back to deck'}
          onNameChange={
            readOnly
              ? undefined
              : (name) => onPersist({ ...deck, name, updatedAt: Date.now() })
          }
          onToggleValidation={() => setValidationExpanded((v) => !v)}
          validationExpanded={validationExpanded}
          onImport={readOnly ? undefined : () => onIoModeChange('import')}
          onExport={() => onIoModeChange('export')}
          onEdit={canEdit ? onEdit : undefined}
          infoDrawerOpen={infoDrawerOpen}
          onToggleInfoDrawer={
            isMobile || readOnly
              ? undefined
              : () => {
                  hapticPress();
                  setInfoDrawerOpen((open) => !open);
                }
          }
          onOpenInfo={
            isMobile && !readOnly
              ? () => {
                  hapticPress();
                  setMobilePanel('info');
                }
              : undefined
          }
          onOpenList={
            isMobile
              ? () => {
                  hapticPress();
                  setMobilePanel('list');
                }
              : undefined
          }
          catalogSection={readOnly ? undefined : catalogSection}
          onCatalogSectionChange={readOnly ? undefined : focusCatalogSection}
          catalogSectionItems={readOnly ? undefined : browseSectionNavItems}
          catalogFilters={readOnly ? undefined : mobileFilterChrome?.filters}
          onOpenCatalogFilters={readOnly ? undefined : mobileFilterChrome?.onOpen}
        />

        {readOnly ? (
          isMobile ? (
            <View className="min-h-0 flex-1">{showcasePanel}</View>
          ) : (
            <View className="min-h-0 flex-1 flex-row gap-3">
              <View className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card px-3 py-3">
                {showcasePanel}
              </View>
              <View
                className="min-h-0 overflow-hidden rounded-xl border border-border bg-card"
                style={{ width: DECK_COMPOSITION_LIST_WIDTH }}
              >
                {compositionList}
              </View>
            </View>
          )
        ) : isMobile ? (
          <View className="min-h-0 flex-1">{catalogPanel}</View>
        ) : (
          <View className="min-h-0 flex-1 flex-row gap-3">
            <View
              className={cn(
                'min-h-0 overflow-hidden rounded-xl border border-border bg-card',
                !infoDrawerOpen && 'border-0'
              )}
              style={{
                width: infoDrawerOpen ? DECK_INFO_DRAWER_WIDTH : 0,
                opacity: infoDrawerOpen ? 1 : 0,
              }}
              pointerEvents={infoDrawerOpen ? 'auto' : 'none'}
            >
              {infoDrawer}
            </View>

            <View className="min-h-0 min-w-0 flex-1">{catalogPanel}</View>

            <View
              className="min-h-0 overflow-hidden rounded-xl border border-border bg-card"
              style={{ width: DECK_COMPOSITION_LIST_WIDTH }}
            >
              {compositionList}
            </View>
          </View>
        )}
      </View>

      {isMobile ? (
        <BottomSheet
          open={mobilePanel != null}
          onOpenChange={(next) => {
            if (!next) setMobilePanel(null);
          }}
        >
          <BottomSheetPortal>
            <BottomSheetOverlay />
            <BottomSheetContent
              snapPoints={mobileSnapPoints}
              defaultSnapIndex={0}
              enablePanDownToClose
              enableOverDrag={!reduceMotion}
              enableContentPanningGesture
            >
              {mobilePanel === 'info' ? (
                <BottomSheetScrollView
                  className="flex-1"
                  contentContainerStyle={{ paddingBottom: sheetPaddingBottom }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {infoDrawer}
                </BottomSheetScrollView>
              ) : null}
              {mobilePanel === 'list' ? (
                <View className="min-h-0 flex-1">{compositionList}</View>
              ) : null}
            </BottomSheetContent>
          </BottomSheetPortal>
        </BottomSheet>
      ) : null}

      {ioMode === 'export' || (ioMode === 'import' && !readOnly) ? (
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
