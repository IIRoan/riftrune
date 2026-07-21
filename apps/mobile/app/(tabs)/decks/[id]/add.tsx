import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { BattlefieldCardArt } from '@/components/deck/BattlefieldCardArt';
import { CardArtHoverPreview } from '@/components/deck/CardArtHoverPreview';
import { DeckAddSectionStatus } from '@/components/deck/DeckAddSectionStatus';
import { DeckAddScreenHeader } from '@/components/deck/DeckAddScreenHeader';
import {
  CatalogActiveFilterChips,
  CatalogFilterSheet,
  CatalogFilterTrigger,
} from '@/components/catalog/FilterSheet';
import { CatalogDesktopFilterBar } from '@/components/catalog/CatalogDesktopFilterBar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppLoader } from '@/components/ui/app-loader';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SearchInput } from '@/components/ui/search-input';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import {
  DECK_SECTIONS,
  type DeckCard,
  type DeckSectionKey,
  type DeckState,
} from '@/lib/deck-types';
import { DeckSectionTabs } from '@/components/deck/DeckSectionList';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { useScreenLayout } from '@/components/shell/ScreenLayout';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { useDeckAddCatalog } from '@/hooks/useDeckAddCatalog';
import { useDeckAutoSave } from '@/hooks/useDeckAutoSave';
import { useDeckDetail } from '@/hooks/useDeckDetail';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import {
  defaultDeckAddCatalogFilters,
  defaultDeckAddSearch,
} from '@/lib/deck-add-catalog';
import {
  catalogFiltersActive,
  sanitizeCatalogFilters,
  type CatalogFilters,
} from '@/constants/catalogFilters';
import { addCardToDeck, changeDeckCardQty, removeDeckCard } from '@/lib/deck-card';
import { leaveDeckAddScreen } from '@/lib/deck-navigation';
import { isCardEligibleForSection } from '@/lib/deck-eligibility';
import { battlefieldsAtCapacity } from '@/lib/deck-limits';
import {
  deckAddUsesSingleSelectUi,
  deckMembershipRevision,
  getDeckCandidateCount,
} from '@/lib/deck-membership';
import { useDebounce } from '@/hooks/useDebounce';
import { hapticPress } from '@/utils/haptics';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { openCard } from '@/utils/cardNavigation';
import { cn } from '@/lib/utils';

function normalizeSectionParam(value: string | undefined): DeckSectionKey {
  if (!value) return 'mainDeck';
  const found = DECK_SECTIONS.find((s) => s.key === value);
  return found?.key ?? 'mainDeck';
}

const AddOneTile = memo(function AddOneTile({
  tileWidth,
  candidate,
  count,
  onAdd,
  onRemove,
  onLongPressCard,
  showSelected,
  selected,
  blocked,
  blockedLabel = 'Slots full',
  horizontal = false,
}: {
  tileWidth: number;
  candidate: DeckCard;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  onLongPressCard: () => void;
  showSelected: boolean;
  selected: boolean;
  blocked?: boolean;
  blockedLabel?: string;
  /** Battlefield cards use landscape art (same as builder). */
  horizontal?: boolean;
}) {
  const canAdd = !blocked && !(showSelected && selected);
  const canRemove = count > 0;
  const imageUri = candidate.imageUrl ? resolveImageUrl(candidate.imageUrl) : '';
  const showHoverInfo = Platform.OS === 'web' && Boolean(imageUri);

  return (
    <View style={{ width: tileWidth }} className="gap-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          canRemove && !canAdd
            ? `Remove ${candidate.name}`
            : `Add ${candidate.name}`
        }
        accessibilityState={{ disabled: !canAdd && !canRemove }}
        className={blocked && !canRemove ? 'opacity-55' : 'active:opacity-95'}
        onPress={() => {
          if (canAdd) {
            void hapticPress();
            onAdd();
            return;
          }
          if (showSelected && selected) {
            void hapticPress();
            onRemove();
          }
        }}
        onLongPress={onLongPressCard}
      >
        <View
          className={cn(
            'relative w-full overflow-hidden border bg-background',
            horizontal ? 'aspect-[7/5]' : 'aspect-[5/7]',
            CARD_ART_RADIUS_CLASS,
            selected || count > 0
              ? 'border-primary/60'
              : blocked
                ? 'border-border/70'
                : 'border-white/10'
          )}
        >
          {imageUri ? (
            horizontal ? (
              <BattlefieldCardArt uri={imageUri} variantNumber={candidate.variantNumber} />
            ) : (
              <DeckCardArt uri={imageUri} variantNumber={candidate.variantNumber} />
            )
          ) : (
            <View className="flex-1 items-center justify-center bg-card-panel">
              <ThemedIonicon name="image-outline" size={20} color="muted-foreground" />
            </View>
          )}

          {showHoverInfo ? (
            <View className="absolute right-1 top-1 z-10">
              <CardArtHoverPreview
                imageUri={imageUri}
                variantNumber={candidate.variantNumber}
                orientation={horizontal ? 'landscape' : 'portrait'}
              >
                <Pressable
                  accessibilityLabel={`Preview ${candidate.name}`}
                  className="size-7 items-center justify-center rounded-md border border-white/10 bg-background/92"
                  onPress={(event) => {
                    event.stopPropagation?.();
                  }}
                >
                  <ThemedIonicon name="information-circle-outline" size={16} color="foreground" />
                </Pressable>
              </CardArtHoverPreview>
            </View>
          ) : null}

          {canRemove && !showSelected ? (
            <View className="absolute inset-x-0 bottom-0 flex-row items-stretch bg-background/80">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove one ${candidate.name}`}
                className="min-h-9 flex-1 items-center justify-center active:bg-background/90"
                onPress={(event) => {
                  event.stopPropagation?.();
                  void hapticPress();
                  onRemove();
                }}
              >
                <ThemedIonicon name="remove" size={16} color="foreground" />
              </Pressable>
              <View className="min-w-8 items-center justify-center px-1">
                <Text className="font-mono text-[12px] font-bold text-foreground">×{count}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add one ${candidate.name}`}
                accessibilityState={{ disabled: !canAdd }}
                className={cn(
                  'min-h-9 flex-1 items-center justify-center',
                  canAdd ? 'active:bg-background/90' : 'opacity-40'
                )}
                disabled={!canAdd}
                onPress={(event) => {
                  event.stopPropagation?.();
                  if (!canAdd) return;
                  void hapticPress();
                  onAdd();
                }}
              >
                <ThemedIonicon name="add" size={16} color="primary" />
              </Pressable>
            </View>
          ) : showSelected && selected ? (
            <View className="absolute inset-x-0 bottom-0 bg-background/80 p-1.5">
              <View className="flex-row items-center justify-center gap-1">
                <ThemedIonicon name="remove-circle-outline" size={14} color="primary" />
                <Text className="text-center font-semibold text-primary">Remove</Text>
              </View>
            </View>
          ) : blocked ? (
            <View className="absolute inset-x-0 bottom-0 bg-background/80 p-1.5">
              <Text className="text-center text-[11px] font-medium text-muted-foreground">
                {blockedLabel}
              </Text>
            </View>
          ) : (
            <View className="absolute inset-x-0 bottom-0 bg-background/65 p-1.5">
              <View className="flex-row items-center justify-center gap-1">
                <ThemedIonicon name="add" size={14} color="primary" />
                <Text className="font-semibold text-primary">Add</Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>

      <Text className="px-0.5 text-[12px] font-semibold text-foreground" numberOfLines={2}>
        {candidate.name}
      </Text>
    </View>
  );
});

export default function DeckAddScreen() {
  const { id, section: sectionParam } = useLocalSearchParams<{ id: string; section?: string }>();
  const { deck, isLoading, persist, flushSave } = useDeckDetail(id);

  if (isLoading || !deck) {
    return (
      <ScreenLayout mode="flex" contentClassName="min-h-0 flex-1">
        <View className="flex-1 items-center justify-center">
          <AppLoader size="md" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout mode="flex" contentClassName="min-h-0 flex-1">
      <DeckAddScreenBody
        deckId={id}
        deck={deck}
        sectionParam={sectionParam}
        onPersist={persist}
        onFlushSave={flushSave}
      />
    </ScreenLayout>
  );
}

function DeckAddScreenBody({
  deckId,
  deck,
  sectionParam,
  onPersist,
  onFlushSave,
}: {
  deckId: string;
  deck: DeckState;
  sectionParam?: string;
  onPersist: (
    deck: DeckState | ((previous: DeckState) => DeckState),
    options?: { immediate?: boolean }
  ) => void;
  onFlushSave: () => Promise<DeckState | null>;
}) {
  const router = useRouter();
  const isMobile = useMobileLayout();
  const section = normalizeSectionParam(sectionParam);
  const lockedSection = Boolean(sectionParam);

  const [activeSection, setActiveSection] = useState<DeckSectionKey>(section);
  useEffect(() => setActiveSection(section), [section]);

  const { paddingBottomInline, contentWidth } = useScreenLayout();
  const grid = useResponsiveColumns('grid', {
    measuredWidth: contentWidth,
  });
  const isBattlefieldSection = activeSection === 'battlefields';
  /** Wider tiles so landscape battlefield art matches the builder slots. */
  const { tileWidth, gap, numColumns } = useMemo(() => {
    if (!isBattlefieldSection) return grid;
    const columns = Math.max(2, Math.min(isMobile ? 2 : 4, grid.numColumns));
    const width = (contentWidth - grid.gap * (columns - 1)) / columns;
    return {
      numColumns: columns,
      tileWidth: Math.max(120, width),
      gap: grid.gap,
    };
  }, [contentWidth, grid, isBattlefieldSection, isMobile]);

  const legendKey = deck.legend?.variantNumber ?? '';

  const [query, setQuery] = useState(() => defaultDeckAddSearch(section, deck));
  const debouncedQuery = useDebounce(query.trim(), 300);

  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(() =>
    defaultDeckAddCatalogFilters(section, deck)
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const applyCatalogFilters = useCallback((next: CatalogFilters) => {
    setCatalogFilters(sanitizeCatalogFilters(next));
  }, []);

  useEffect(() => {
    setCatalogFilters(defaultDeckAddCatalogFilters(activeSection, deck));
  }, [activeSection, legendKey]);

  useEffect(() => {
    if (!legendKey || activeSection !== 'champion') return;
    setQuery(defaultDeckAddSearch('champion', deck));
  }, [legendKey]);

  useEffect(() => {
    if (activeSection === 'champion') {
      setQuery((prev) => (prev.trim() ? prev : defaultDeckAddSearch('champion', deck)));
    } else if (!lockedSection) {
      setQuery('');
    }
  }, [activeSection, lockedSection]);

  const catalog = useDeckAddCatalog(deck, activeSection, debouncedQuery, catalogFilters);
  useDeckAutoSave(deck);

  const handleBack = useCallback(async () => {
    try {
      await onFlushSave();
    } finally {
      leaveDeckAddScreen(router, deckId);
    }
  }, [deckId, onFlushSave, router]);

  const handleAddOne = useCallback(
    (candidate: DeckCard) => {
      const eligibility = isCardEligibleForSection({
        deck,
        section: activeSection,
        candidateCard: candidate,
      });
      if (!eligibility.eligible) return;
      onPersist(
        (prev) => addCardToDeck(prev, candidate, { section: activeSection }),
        { immediate: true }
      );
    },
    [deck, onPersist, activeSection]
  );

  const handleRemoveOne = useCallback(
    (candidate: DeckCard) => {
      if (activeSection === 'legend' || activeSection === 'champion') {
        onPersist((prev) => removeDeckCard(prev, activeSection), { immediate: true });
        return;
      }

      const entry = getDeckCandidateCount(deck, activeSection, candidate);
      if (entry <= 0) return;

      onPersist(
        (prev) => changeDeckCardQty(prev, activeSection, candidate.name, -1),
        { immediate: true }
      );
    },
    [activeSection, deck, onPersist]
  );

  const usesSingleSelectUi = deckAddUsesSingleSelectUi(activeSection);
  const membershipRevision = deckMembershipRevision(deck);
  const sectionFull =
    activeSection === 'battlefields' && battlefieldsAtCapacity(deck);

  const renderItem = useCallback<ListRenderItem<DeckCard>>(
    ({ item }) => {
      const count = getDeckCandidateCount(deck, activeSection, item);
      const inDeck = count > 0;
      const selected = usesSingleSelectUi && inDeck;
      const eligibility = isCardEligibleForSection({
        deck,
        section: activeSection,
        candidateCard: item,
      });
      const blocked = !eligibility.eligible && !selected;
      const blockedLabel =
        activeSection === 'battlefields' && sectionFull && !inDeck
          ? 'Slots full'
          : eligibility.reason?.includes('copy')
            ? 'Max copies'
            : 'Unavailable';

      return (
        <AddOneTile
          tileWidth={tileWidth}
          candidate={item}
          count={count}
          selected={selected}
          showSelected={usesSingleSelectUi}
          blocked={blocked}
          blockedLabel={blockedLabel}
          horizontal={isBattlefieldSection}
          onAdd={() => handleAddOne(item)}
          onRemove={() => handleRemoveOne(item)}
          onLongPressCard={() => openCard(router, item.variantNumber, 'modal')}
        />
      );
    },
    [
      activeSection,
      deck,
      handleAddOne,
      handleRemoveOne,
      isBattlefieldSection,
      membershipRevision,
      router,
      sectionFull,
      tileWidth,
      usesSingleSelectUi,
    ]
  );

  const listFooter =
    catalog.isFetchingNextPage ? (
      <View className="items-center py-4">
        <AppLoader size="sm" />
      </View>
    ) : null;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!catalog.hasNextPage || catalog.isFetchingNextPage) return;

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromEnd =
        contentSize.height - (layoutMeasurement.height + contentOffset.y);

      if (distanceFromEnd < 320) {
        catalog.fetchNextPage();
      }
    },
    [catalog]
  );

  const showBlockingLoader = catalog.isLoading && catalog.cards.length === 0;

  const emptyState = (
    <Empty className="border border-dashed border-border py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-1 size-14">
          <ThemedIonicon name="albums-outline" size={28} color="ring" />
        </EmptyMedia>
        <EmptyTitle>{catalog.emptyState.title}</EmptyTitle>
        <EmptyDescription>{catalog.emptyState.description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );

  const filterActive = catalogFiltersActive(catalogFilters);

  return (
    <View className="flex-1 gap-2">
      <DeckAddScreenHeader deck={deck} section={activeSection} onBack={() => void handleBack()} />

      <View className="shrink-0 gap-1.5">
        <View className={cn('gap-2', !isMobile && 'flex-row items-center gap-3')}>
          <View className={cn('min-w-0 flex-1', !isMobile && 'flex-1')}>
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder={catalog.sectionMeta.placeholder}
              autoFocus
            />
          </View>
          {isMobile ? (
            <CatalogFilterTrigger
              filters={catalogFilters}
              onPress={() => setFilterSheetOpen(true)}
              compact
              mobile
            />
          ) : null}
        </View>

        {!isMobile ? (
          <CatalogDesktopFilterBar
            filters={catalogFilters}
            onFiltersChange={applyCatalogFilters}
          />
        ) : null}

        {filterActive ? (
          <CatalogActiveFilterChips
            filters={catalogFilters}
            onFiltersChange={applyCatalogFilters}
          />
        ) : null}

        {catalog.sectionMeta.contextLine ? (
          <Text className="text-[12px] text-muted-foreground">
            {catalog.sectionMeta.contextLine}
          </Text>
        ) : null}

        <DeckAddSectionStatus deck={deck} section={activeSection} />

        {!lockedSection ? (
          <DeckSectionTabs
            deck={deck}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        ) : null}
      </View>

      <FlatList
        data={catalog.cards}
        key={`${activeSection}-${numColumns}`}
        keyExtractor={(item) => item.variantNumber}
        numColumns={numColumns}
        renderItem={renderItem}
        extraData={membershipRevision}
        ListEmptyComponent={showBlockingLoader ? null : emptyState}
        ListFooterComponent={listFooter}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={() => {
          if (catalog.hasNextPage && !catalog.isFetchingNextPage) {
            catalog.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.25}
        removeClippedSubviews={false}
        initialNumToRender={24}
        maxToRenderPerBatch={32}
        windowSize={11}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: paddingBottomInline,
          flexGrow: catalog.cards.length === 0 ? 1 : undefined,
        }}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        columnWrapperStyle={numColumns > 1 ? { gap, marginBottom: gap } : undefined}
      />

      {showBlockingLoader ? (
        <View className="absolute inset-0 items-center justify-center">
          <AppLoader size="md" />
        </View>
      ) : null}

      <CatalogFilterSheet
        visible={filterSheetOpen}
        filters={catalogFilters}
        onClose={() => setFilterSheetOpen(false)}
        onFiltersChange={applyCatalogFilters}
      />
    </View>
  );
}
