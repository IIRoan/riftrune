import { ThemedIcon, LibraryIcon } from '@/components/icons';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppLoader } from '@/components/ui/app-loader';
import {
  FlatList,
  View,
  type LayoutChangeEvent,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  CatalogActiveFilterChips,
  CatalogFilterSheet,
} from '@/components/catalog/FilterSheet';
import { CatalogDesktopFilterBar } from '@/components/catalog/CatalogDesktopFilterBar';
import { DeckCatalogGridTile } from '@/components/deck/DeckCatalogGridTile';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import {
  catalogFiltersActive,
  sanitizeCatalogFilters,
  type CatalogFilters,
} from '@/constants/catalogFilters';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import { useDebounce } from '@/hooks/useDebounce';
import { useDeckAddCatalog } from '@/hooks/useDeckAddCatalog';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
  defaultDeckAddCatalogFilters,
  defaultDeckAddSearch,
} from '@/lib/deck-add-catalog';
import { isCardTournamentIllegal } from '@/lib/card-legality';
import { addCardToDeck, changeDeckCardQty } from '@/lib/deck-card';
import { isCardEligibleForSection } from '@/lib/deck-eligibility';
import {
  deckMembershipRevision,
  getDeckCandidateCount,
  listDeckSectionCards,
} from '@/lib/deck-membership';
import type { DeckCard, DeckState } from '@/lib/deck-types';
import { ownedCountForCardName } from '@/lib/deck-validation';
import { openCard } from '@/utils/cardNavigation';

type BuilderCatalogSection = 'mainDeck' | 'sideboard';

interface DeckBuilderCatalogPanelProps {
  deck: DeckState;
  readOnly?: boolean;
  collectionByName?: ReadonlyMap<string, number>;
  onPersist: (
    deck: DeckState | ((previous: DeckState) => DeckState),
    options?: { immediate?: boolean }
  ) => void;
  /** Controlled section when parent wants to jump to main/side (e.g. status strip). */
  section?: BuilderCatalogSection;
  onSectionChange?: (section: BuilderCatalogSection) => void;
  paddingBottom?: number;
  onMobileFilterChromeChange?: (
    chrome: { filters: CatalogFilters; onOpen: () => void } | null
  ) => void;
}

const CatalogTile = memo(function CatalogTile({
  tileWidth,
  candidate,
  count,
  owned = null,
  blocked,
  blockedLabel = 'Unavailable',
  illegal = false,
  readOnly,
  onAdd,
  onRemove,
  onOpenCard,
}: {
  tileWidth: number;
  candidate: DeckCard;
  count: number;
  owned?: number | null;
  blocked?: boolean;
  blockedLabel?: string;
  illegal?: boolean;
  readOnly?: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onOpenCard: () => void;
}) {
  return (
    <DeckCatalogGridTile
      tileWidth={tileWidth}
      candidate={candidate}
      count={count}
      owned={owned}
      blocked={blocked}
      blockedLabel={blockedLabel}
      illegal={illegal}
      readOnly={readOnly}
      onAdd={onAdd}
      onRemove={onRemove}
      onOpenCard={onOpenCard}
    />
  );
});

export function DeckBuilderCatalogPanel({
  deck,
  readOnly = false,
  collectionByName,
  onPersist,
  section: controlledSection,
  onSectionChange: _onSectionChange,
  paddingBottom = 0,
  onMobileFilterChromeChange,
}: DeckBuilderCatalogPanelProps) {
  const router = useRouter();
  const isMobile = useMobileLayout();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const { tileWidth, gap, numColumns } = useResponsiveColumns('grid', {
    measuredWidth,
    fillAvailable: true,
  });

  const [internalSection, setInternalSection] = useState<BuilderCatalogSection>('mainDeck');
  const section = controlledSection ?? internalSection;

  useEffect(() => {
    if (controlledSection != null) setInternalSection(controlledSection);
  }, [controlledSection]);

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
    setCatalogFilters(defaultDeckAddCatalogFilters(section, deck));
    setQuery(defaultDeckAddSearch(section, deck));
  }, [section, legendKey]);

  const catalog = useDeckAddCatalog(deck, section, debouncedQuery, catalogFilters, {
    enabled: !readOnly,
  });
  const membershipRevision = deckMembershipRevision(deck);
  const filterActive = !readOnly && catalogFiltersActive(catalogFilters);

  const openFilterSheet = useCallback(() => {
    setFilterSheetOpen(true);
  }, []);

  useEffect(() => {
    if (!onMobileFilterChromeChange) return;
    if (readOnly || !isMobile) {
      onMobileFilterChromeChange(null);
      return;
    }
    onMobileFilterChromeChange({ filters: catalogFilters, onOpen: openFilterSheet });
    return () => onMobileFilterChromeChange(null);
  }, [
    catalogFilters,
    isMobile,
    onMobileFilterChromeChange,
    openFilterSheet,
    readOnly,
  ]);

  const browseCards = useMemo(() => {
    if (!readOnly) return [] as DeckCard[];
    const cards = listDeckSectionCards(deck, section);
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (card) =>
        card.name.toLowerCase().includes(q) ||
        card.variantNumber.toLowerCase().includes(q)
    );
  }, [debouncedQuery, deck, readOnly, section]);

  const displayCards = readOnly ? browseCards : catalog.cards;
  const searchPlaceholder = readOnly
    ? section === 'sideboard'
      ? 'Search sideboard'
      : 'Search this deck'
    : catalog.sectionMeta.placeholder;
  const contextLine = readOnly ? null : catalog.sectionMeta.contextLine;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0) setMeasuredWidth((prev) => (prev === next ? prev : next));
  }, []);

  const handleAddOne = useCallback(
    (candidate: DeckCard) => {
      if (readOnly) return;
      const eligibility = isCardEligibleForSection({
        deck,
        section,
        candidateCard: candidate,
      });
      if (!eligibility.eligible) return;
      onPersist((prev) => addCardToDeck(prev, candidate, { section }), { immediate: true });
    },
    [deck, onPersist, readOnly, section]
  );

  const handleRemoveOne = useCallback(
    (candidate: DeckCard) => {
      if (readOnly) return;
      const entry = getDeckCandidateCount(deck, section, candidate);
      if (entry <= 0) return;
      onPersist((prev) => changeDeckCardQty(prev, section, candidate.name, -1), {
        immediate: true,
      });
    },
    [deck, onPersist, readOnly, section]
  );

  const renderItem = useCallback<ListRenderItem<DeckCard>>(
    ({ item }) => {
      const count = getDeckCandidateCount(deck, section, item);
      const eligibility = isCardEligibleForSection({
        deck,
        section,
        candidateCard: item,
      });
      const blocked = !readOnly && !eligibility.eligible && count === 0;
      const blockedLabel = eligibility.reason?.includes('copy')
        ? 'Max copies'
        : 'Unavailable';
      const illegal = isCardTournamentIllegal(item, deck);
      const owned =
        count > 0 && collectionByName
          ? ownedCountForCardName(item.name, collectionByName)
          : null;

      return (
        <CatalogTile
          tileWidth={tileWidth}
          candidate={item}
          count={count}
          owned={owned}
          blocked={blocked}
          blockedLabel={blockedLabel}
          illegal={illegal}
          readOnly={readOnly}
          onAdd={() => handleAddOne(item)}
          onRemove={() => handleRemoveOne(item)}
          onOpenCard={() => openCard(router, item.variantNumber, 'modal')}
        />
      );
    },
    [
      collectionByName,
      deck,
      handleAddOne,
      handleRemoveOne,
      membershipRevision,
      readOnly,
      router,
      section,
      tileWidth,
    ]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (readOnly || !catalog.hasNextPage || catalog.isFetchingNextPage) return;
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromEnd =
        contentSize.height - (layoutMeasurement.height + contentOffset.y);
      if (distanceFromEnd < 320) catalog.fetchNextPage();
    },
    [catalog, readOnly]
  );

  const showBlockingLoader = !readOnly && catalog.isLoading && catalog.cards.length === 0;

  const emptyState = (
    <Empty className="border border-dashed border-border py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-1 size-14">
          <ThemedIcon icon={LibraryIcon} size={28} color="ring" />
        </EmptyMedia>
        <EmptyTitle>
          {readOnly
            ? debouncedQuery
              ? 'No matching cards'
              : section === 'sideboard'
                ? 'Empty sideboard'
                : 'Empty main deck'
            : catalog.emptyState.title}
        </EmptyTitle>
        <EmptyDescription>
          {readOnly
            ? debouncedQuery
              ? 'Try a different search.'
              : section === 'sideboard'
                ? 'This deck has no sideboard cards.'
                : 'This deck has no main deck cards.'
            : catalog.emptyState.description}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );

  return (
    <View className="min-h-0 flex-1 gap-2" onLayout={onLayout}>
      <View className="shrink-0 gap-1.5">
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
        />

        {!readOnly && !isMobile ? (
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

        {contextLine ? (
          <Text className="text-[12px] text-muted-foreground">{contextLine}</Text>
        ) : null}
      </View>

      <FlatList
        data={displayCards}
        key={`${section}-${numColumns}-${readOnly ? 'browse' : 'add'}`}
        keyExtractor={(item) => item.variantNumber}
        numColumns={numColumns}
        renderItem={renderItem}
        extraData={membershipRevision}
        ListEmptyComponent={showBlockingLoader ? null : emptyState}
        ListFooterComponent={
          !readOnly && catalog.isFetchingNextPage ? (
            <View className="items-center py-4">
              <AppLoader size="sm" />
            </View>
          ) : null
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={() => {
          if (readOnly) return;
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
          paddingBottom,
          flexGrow: displayCards.length === 0 ? 1 : undefined,
        }}
        keyboardShouldPersistTaps="handled"
        className="min-h-0 flex-1"
        columnWrapperStyle={numColumns > 1 ? { gap, marginBottom: gap } : undefined}
      />

      {showBlockingLoader ? (
        <View className="absolute inset-0 items-center justify-center">
          <AppLoader size="md" />
        </View>
      ) : null}

      {!readOnly ? (
        <CatalogFilterSheet
          visible={filterSheetOpen}
          filters={catalogFilters}
          onClose={() => setFilterSheetOpen(false)}
          onFiltersChange={applyCatalogFilters}
        />
      ) : null}
    </View>
  );
}
