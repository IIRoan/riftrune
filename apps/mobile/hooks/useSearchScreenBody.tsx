import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import {
  InteractionManager,
  Keyboard,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { type FlashListRef, type ViewToken } from '@shopify/flash-list';
import type { CardListItem } from '@riftbound/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { CardDetailDrawer } from '@/components/catalog/CardDetailDrawer';
import { CatalogDetailPanel } from '@/components/catalog/CatalogDetailPanel';
import { CatalogFilterSheet } from '@/components/catalog/FilterSheet';
import { SortSheet } from '@/components/catalog/SortSheet';
import { SearchCatalogList } from '@/components/search/SearchCatalogList';
import { SearchScreenListEmpty } from '@/components/search/SearchScreenListEmpty';
import { SearchScreenToolbar } from '@/components/search/SearchScreenToolbar';
import {
  DEFAULT_CATALOG_SORT,
  normalizeCatalogSort,
  sortOptionKey,
  type CatalogSort,
} from '@/constants/catalogSort';
import {
  catalogFiltersActive,
  catalogFiltersQueryKey,
  DEFAULT_CATALOG_FILTERS,
  matchesCatalogFilters,
  sanitizeCatalogFilters,
  type CatalogFilters,
} from '@/constants/catalogFilters';
import {
  ScreenLayout,
  ScreenLayoutBody,
  ScreenSplit,
  useScreenLayout,
} from '@/components/shell/ScreenLayout';
import { useTheme } from '@/context/ThemeContext';
import { useCardSearch } from '@/hooks/useCardSearch';
import { useCatalogBrowseInfinite } from '@/hooks/useCatalogBrowseInfinite';
import { useLatestRef } from '@/hooks/useLatestRef';
import { prefetchCatalogFilters } from '@/hooks/useFiltersData';
import { useCollectionOwnership, useCollection } from '@/hooks/useCollection';
import { collectVariantNumbers, ownershipMapFromCollection, preferCollectionOwnership } from '@/utils/collectionOwnership';
import { cardListItemMatchesVariant } from '@/utils/variants';
import {
  CATALOG_DETAIL_GAP,
  DETAIL_PANEL_WIDTH,
  SIDE_RAIL_WIDTH,
  useCatalogSplitLayout,
  useMobileLayout,
} from '@/hooks/useBreakpoint';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { prefetchCardDetail, ensureCardDetail } from '@/lib/prefetchCardDetail';
import {
  catalogLookaheadCount,
  catalogViewportTargetHeight,
  estimateCatalogPageSize,
  isFastCatalogScroll,
  measureCatalogScrollVelocity,
  shouldPrefetchCatalog,
  type CatalogScrollMetrics,
} from '@/lib/catalog-page-size';
import {
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistoryItem,
  type SearchHistoryItem,
} from '@/services/searchHistoryService';
import { hapticPress } from '@/utils/haptics';

export function useSearchScreenBody(): React.ReactElement {
  const { defaultLayout, setDefaultLayout } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const { contentWidth: layoutContentWidth, paddingBottomInline, showRail } =
    useScreenLayout();
  const [splitMainWidth, setSplitMainWidth] = useState<number | null>(null);
  const splitLayout = useCatalogSplitLayout();
  const isMobile = useMobileLayout();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(
    DEFAULT_CATALOG_FILTERS
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const applyCatalogFilters = useCallback((next: CatalogFilters) => {
    setCatalogFilters(sanitizeCatalogFilters(next));
  }, []);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [catalogSort, setCatalogSort] = useState<CatalogSort>(DEFAULT_CATALOG_SORT);
  const [sortPending, setSortPending] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const catalogListRef = useRef<FlashListRef<CardListItem>>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;

  const view = defaultLayout;
  const setView = setDefaultLayout;

  const catalogColumnWidth = splitLayout
    ? (splitMainWidth ??
      Math.max(280, layoutContentWidth - DETAIL_PANEL_WIDTH - CATALOG_DETAIL_GAP))
    : layoutContentWidth;

  const catalogReservedWidth = useMemo(() => {
    let reserved = 0;
    if (showRail) reserved += SIDE_RAIL_WIDTH;
    if (splitLayout) {
      reserved += 48;
      if (selectedVariant) {
        reserved += DETAIL_PANEL_WIDTH + CATALOG_DETAIL_GAP;
      }
    }
    return reserved;
  }, [showRail, splitLayout, selectedVariant]);

  const { numColumns, contentWidth, tileWidth, compact } = useResponsiveColumns(
    view,
    {
      reservedWidth: splitLayout ? catalogReservedWidth : showRail ? SIDE_RAIL_WIDTH : 0,
      measuredWidth: splitLayout ? catalogColumnWidth : layoutContentWidth,
      fillAvailable: view === 'grid',
    }
  );

  const catalogViewportHeight = useMemo(
    () => Math.max(320, windowHeight - 220),
    [windowHeight]
  );

  const pageSize = useMemo(
    () =>
      estimateCatalogPageSize(
        numColumns,
        view,
        catalogViewportHeight,
        tileWidth,
        compact
      ),
    [numColumns, view, catalogViewportHeight, tileWidth, compact]
  );

  const {
    debouncedQuery,
    items,
    isLoading,
    isFetching,
    isError,
    minLength,
    searchNow,
    hasNextPage: searchHasNextPage,
    isFetchingNextPage: searchIsFetchingNextPage,
    fetchNextPage: fetchNextSearchPage,
  } = useCardSearch(query, catalogSort, pageSize, catalogFilters);

  const trimmedQuery = query.trim();
  const hasSearchInput = trimmedQuery.length >= minLength;
  const searchPending = hasSearchInput && trimmedQuery !== debouncedQuery;
  const ownershipVariantSetRef = useRef(new Set<string>());
  const ownershipFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ownershipRevision, setOwnershipRevision] = useState(0);

  const queueOwnershipFetch = useCallback(() => {
    if (ownershipFlushTimerRef.current) return;
    ownershipFlushTimerRef.current = setTimeout(() => {
      ownershipFlushTimerRef.current = null;
      setOwnershipRevision((revision) => revision + 1);
    }, 400);
  }, []);

  useEffect(
    () => () => {
      if (ownershipFlushTimerRef.current) {
        clearTimeout(ownershipFlushTimerRef.current);
      }
    },
    []
  );

  const ownedFilterActive = catalogFilters.collection === 'owned';
  // Keep full collection warm so list tiles show owned counts without waiting
  // for a detail click / per-variant quantities round-trip.
  const { data: collectionEntries = [] } = useCollection();

  const ownershipVariants = useMemo(() => {
    void ownershipRevision;
    const variants = [...ownershipVariantSetRef.current];
    if (selectedVariant && !variants.includes(selectedVariant)) {
      variants.push(selectedVariant);
    }
    return variants.sort();
  }, [ownershipRevision, selectedVariant]);

  const { collectionByVariant: fetchedOwnership } = useCollectionOwnership(ownershipVariants);

  const collectionByVariant = useMemo(() => {
    const fromCollection = ownershipMapFromCollection(collectionEntries);
    return preferCollectionOwnership(fetchedOwnership, fromCollection);
  }, [collectionEntries, fetchedOwnership]);

  const filterOwnership = useMemo(() => {
    if (!ownedFilterActive) return collectionByVariant;
    const ownedMap = new Map(ownershipMapFromCollection(collectionEntries));
    for (const [variantNumber, entry] of collectionByVariant) {
      const current = ownedMap.get(variantNumber)?.quantity ?? 0;
      if (entry.quantity > current) {
        ownedMap.set(variantNumber, entry);
      }
    }
    return ownedMap;
  }, [ownedFilterActive, collectionEntries, collectionByVariant]);

  const browseCatalog = useCatalogBrowseInfinite(
    pageSize,
    catalogFilters,
    filterOwnership,
    catalogSort
  );

  const filteredItems = useMemo(
    () =>
      items.filter((card) => matchesCatalogFilters(card, catalogFilters, filterOwnership)),
    [items, catalogFilters, filterOwnership]
  );

  const featuredFiltered = browseCatalog.items;
  const displayItems = hasSearchInput ? filteredItems : featuredFiltered;
  const displayItemsRef = useLatestRef(displayItems);
  const scrollMetricsRef = useRef<CatalogScrollMetrics>({
    distanceFromEnd: Number.POSITIVE_INFINITY,
    viewportHeight: catalogViewportHeight,
    velocityY: 0,
  });
  const lastScrollSampleRef = useRef({ y: 0, t: Date.now() });
  const pendingCatalogFetchRef = useRef(false);
  const isSearching = hasSearchInput;
  const hasNextPage = hasSearchInput ? searchHasNextPage : browseCatalog.hasNextPage;
  const isFetchingNextPage = hasSearchInput
    ? searchIsFetchingNextPage
    : browseCatalog.isFetchingNextPage;
  const fetchNextPage = hasSearchInput ? fetchNextSearchPage : browseCatalog.fetchNextPage;
  const isList = view === 'list';

  const selectedCard = useMemo(
    () =>
      selectedVariant
        ? (displayItems.find((item) => cardListItemMatchesVariant(item, selectedVariant)) ??
          null)
        : null,
    [displayItems, selectedVariant]
  );

  useEffect(() => {
    if (displayItems.length === 0) return;

    let added = false;
    for (const card of displayItems.slice(0, pageSize)) {
      for (const variant of collectVariantNumbers([card])) {
        if (!ownershipVariantSetRef.current.has(variant)) {
          ownershipVariantSetRef.current.add(variant);
          added = true;
        }
      }
    }
    if (added) {
      queueOwnershipFetch();
    }
  }, [displayItems, pageSize, queueOwnershipFetch]);

  useEffect(() => {
    const prefetchFrom = Math.max(0, displayItems.length - pageSize);
    for (const card of displayItems.slice(prefetchFrom)) {
      prefetchCardDetail(queryClient, card);
    }
  }, [displayItems, pageSize, queryClient]);

  useEffect(() => {
    if (!splitLayout) return;
    if (displayItems.length === 0) {
      setSelectedVariant(null);
      return;
    }
    const stillVisible = displayItems.some((c) =>
      cardListItemMatchesVariant(c, selectedVariant)
    );
    if (!stillVisible) {
      setSelectedVariant(displayItems[0]?.variantNumber ?? null);
    }
  }, [displayItems, selectedVariant, splitLayout]);

  const handleSelectCard = useCallback(
    (variantNumber: string) => {
      const item = displayItemsRef.current.find((card) =>
        cardListItemMatchesVariant(card, variantNumber)
      );
      if (item) {
        prefetchCardDetail(queryClient, item);
      }
      // Direct GET for rules text — don't wait on the batch prefetch queue.
      ensureCardDetail(queryClient, variantNumber);
      setSelectedVariant(variantNumber);
    },
    [queryClient, displayItemsRef]
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<CardListItem>[] }) => {
      let added = false;
      let maxIndex = -1;

      for (const entry of viewableItems) {
        if (!entry.item) continue;
        if (typeof entry.index === 'number') {
          maxIndex = Math.max(maxIndex, entry.index);
        }
        prefetchCardDetail(queryClient, entry.item);
        for (const variant of collectVariantNumbers([entry.item])) {
          if (!ownershipVariantSetRef.current.has(variant)) {
            ownershipVariantSetRef.current.add(variant);
            added = true;
          }
        }
      }

      if (maxIndex >= 0) {
        const catalogItems = displayItemsRef.current;
        const lookahead = catalogLookaheadCount(
          isList ? 'list' : 'grid',
          numColumns,
          scrollMetricsRef.current.velocityY
        );
        for (let i = maxIndex + 1; i <= maxIndex + lookahead && i < catalogItems.length; i += 1) {
          prefetchCardDetail(queryClient, catalogItems[i]!);
        }
      }

      if (selectedVariant && !ownershipVariantSetRef.current.has(selectedVariant)) {
        ownershipVariantSetRef.current.add(selectedVariant);
        added = true;
      }

      if (added) {
        queueOwnershipFetch();
      }
    },
    [isList, numColumns, queryClient, selectedVariant, queueOwnershipFetch, displayItemsRef]
  );

  const onViewableItemsChangedRef = useLatestRef(onViewableItemsChanged);

  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken<CardListItem>[] }) => {
      onViewableItemsChangedRef.current(info);
    },
    [onViewableItemsChangedRef]
  );

  const requestCatalogFetch = useCallback(() => {
    if (!hasNextPage) return;
    if (isFetchingNextPage) {
      pendingCatalogFetchRef.current = true;
      return;
    }
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const maybePrefetchCatalog = useCallback(() => {
    if (!hasNextPage) return;
    if (shouldPrefetchCatalog(scrollMetricsRef.current, view, tileWidth, compact)) {
      requestCatalogFetch();
      if (isFastCatalogScroll(scrollMetricsRef.current.velocityY)) {
        requestCatalogFetch();
      }
    }
  }, [compact, hasNextPage, requestCatalogFetch, tileWidth, view]);

  useEffect(() => {
    if (isFetchingNextPage) return;
    if (!pendingCatalogFetchRef.current && !isFastCatalogScroll(scrollMetricsRef.current.velocityY)) {
      return;
    }
    pendingCatalogFetchRef.current = false;
    maybePrefetchCatalog();
  }, [displayItems.length, isFetchingNextPage, maybePrefetchCatalog]);

  const fetchMoreCatalog = useCallback(() => {
    requestCatalogFetch();
  }, [requestCatalogFetch]);

  const catalogTargetHeight = useMemo(
    () => catalogViewportTargetHeight(catalogViewportHeight, view, tileWidth, compact),
    [catalogViewportHeight, view, tileWidth, compact]
  );

  const handleCatalogScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const now = Date.now();
      const velocityY = measureCatalogScrollVelocity(
        lastScrollSampleRef.current,
        contentOffset.y,
        now
      );
      lastScrollSampleRef.current = { y: contentOffset.y, t: now };

      scrollMetricsRef.current = {
        distanceFromEnd:
          contentSize.height - (layoutMeasurement.height + contentOffset.y),
        viewportHeight: layoutMeasurement.height,
        velocityY,
      };

      if (velocityY <= 0) return;
      maybePrefetchCatalog();
    },
    [maybePrefetchCatalog]
  );

  const maybeFillCatalogViewport = useCallback(
    (contentHeight: number) => {
      scrollMetricsRef.current = {
        ...scrollMetricsRef.current,
        distanceFromEnd: Math.max(0, contentHeight - catalogViewportHeight),
        viewportHeight: catalogViewportHeight,
      };
      if (
        contentHeight > 0 &&
        contentHeight < catalogTargetHeight &&
        hasNextPage
      ) {
        requestCatalogFetch();
      } else {
        maybePrefetchCatalog();
      }
    },
    [
      catalogTargetHeight,
      catalogViewportHeight,
      hasNextPage,
      maybePrefetchCatalog,
      requestCatalogFetch,
    ]
  );
  const hasCatalog =
    displayItems.length > 0 ||
    (hasSearchInput && (searchPending || isLoading || isFetching)) ||
    (!hasSearchInput && (browseCatalog.isLoading || browseCatalog.isFetching));
  const filterActive = catalogFiltersActive(catalogFilters);

  const loadHistory = useCallback(async () => {
    setHistory(await getSearchHistory());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
      void prefetchCatalogFilters(queryClient);
    }, [loadHistory, queryClient])
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setShowHistory(true);
  }, []);

  const onHistoryPress = useCallback(
    async (item: SearchHistoryItem) => {
      Keyboard.dismiss();
      await hapticPress();
      setQuery(item.query);
      setShowHistory(false);
      searchNow(item.query);
    },
    [searchNow]
  );

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const onHistoryDelete = useCallback(
    async (item: SearchHistoryItem) => {
      await removeSearchHistoryItem(item.query);
      await loadHistory();
    },
    [loadHistory]
  );

  const onClearAllHistory = useCallback(async () => {
    await clearSearchHistory();
    await loadHistory();
  }, [loadHistory]);

  const listEmpty = useMemo(
    () => (
      <SearchScreenListEmpty
        query={query}
        minLength={minLength}
        fetchStatus={{
          isSearching,
          searchPending,
          isLoading,
          isError,
          isFetching,
        }}
        itemsLength={items.length}
        showHistory={showHistory}
        history={history}
        hasCatalog={hasCatalog}
        browseCatalogLoading={browseCatalog.isLoading}
        featuredFilteredLength={featuredFiltered.length}
        filteredItemsLength={filteredItems.length}
        view={view}
        isList={isList}
        numColumns={numColumns}
        tileWidth={tileWidth}
        compact={compact}
        filterActive={filterActive}
        ownedFilterActive={ownedFilterActive}
        catalogFilters={catalogFilters}
        onClearAllHistory={() => void onClearAllHistory()}
        onHistoryPress={onHistoryPress}
        onHistoryDelete={onHistoryDelete}
      />
    ),
    [
      query,
      isSearching,
      searchPending,
      isLoading,
      isError,
      isFetching,
      showHistory,
      history,
      hasCatalog,
      browseCatalog.isLoading,
      featuredFiltered.length,
      items.length,
      filteredItems.length,
      minLength,
      view,
      isList,
      numColumns,
      tileWidth,
      compact,
      filterActive,
      ownedFilterActive,
      catalogFilters,
      onClearAllHistory,
      onHistoryPress,
      onHistoryDelete,
    ]
  );

  const pageMaxWidth = splitLayout ? undefined : contentWidth;

  const searchPanel = (
    <SearchScreenToolbar
      pageMaxWidth={pageMaxWidth}
      query={query}
      onQueryChange={(text) => {
        setQuery(text);
        if (text.trim().length === 0) {
          setShowHistory(true);
        } else {
          setShowHistory(false);
        }
      }}
      onClearSearch={clearSearch}
      searchLoading={hasSearchInput && (searchPending || isLoading || isFetching)}
      onSubmitSearch={() => {
        searchNow();
      }}
      isMobile={isMobile}
      filterActive={filterActive}
      catalogFilters={catalogFilters}
      onFiltersChange={applyCatalogFilters}
      view={view}
      onViewChange={setView}
      catalogSort={catalogSort}
      onSortPress={() => {
        setSortSheetOpen(true);
      }}
      onFilterPress={() => setFilterSheetOpen(true)}
    />
  );

  const resultsTransitionKey = catalogFiltersQueryKey(catalogFilters);

  useEffect(() => {
    catalogListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [resultsTransitionKey]);

  useEffect(() => {
    if (!sortPending) return;

    let cancelled = false;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();
    const MIN_VISIBLE_MS = 360;

    const task = InteractionManager.runAfterInteractions(() => {
      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt));
      hideTimer = setTimeout(() => {
        if (!cancelled) setSortPending(false);
      }, remaining);
    });

    return () => {
      cancelled = true;
      task.cancel?.();
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [sortPending, catalogSort]);

  const applyCatalogSort = useCallback(
    (next: CatalogSort) => {
      const normalized = normalizeCatalogSort(next);
      if (sortOptionKey(normalized) === sortOptionKey(catalogSort)) return;
      setSortPending(true);
      requestAnimationFrame(() => {
        startTransition(() => {
          setCatalogSort(normalized);
        });
        catalogListRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    },
    [catalogSort]
  );

  const listExtraData = useMemo(
    () => ({
      selectedVariant,
      ownership: collectionByVariant,
      simpleAdd: catalogFilters.simpleAdd,
    }),
    [selectedVariant, collectionByVariant, catalogFilters.simpleAdd]
  );

  const catalogList = (
    <SearchCatalogList
      catalogListRef={catalogListRef}
      displayItems={displayItems}
      hasSearchInput={hasSearchInput}
      view={view}
      numColumns={numColumns}
      isList={isList}
      selectedVariant={selectedVariant}
      splitLayout={splitLayout}
      compact={compact}
      catalogFiltersSimpleAdd={catalogFilters.simpleAdd}
      collectionByVariant={collectionByVariant}
      handleSelectCard={handleSelectCard}
      listExtraData={listExtraData}
      paddingBottomInline={paddingBottomInline}
      listEmpty={listEmpty}
      resultsTransitionKey={resultsTransitionKey}
      sortPending={sortPending}
      dismissKeyboard={dismissKeyboard}
      handleViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      handleCatalogScroll={handleCatalogScroll}
      fetchMoreCatalog={fetchMoreCatalog}
      maybeFillCatalogViewport={maybeFillCatalogViewport}
    />
  );

  return (
    <View className="relative min-h-0 flex-1">
      {splitLayout ? (
        <ScreenSplit
          asideWidth={DETAIL_PANEL_WIDTH}
          onMainWidthChange={setSplitMainWidth}
          aside={
            selectedVariant ? (
              <CatalogDetailPanel variantNumber={selectedVariant} catalogListItem={selectedCard} />
            ) : undefined
          }
        >
          {searchPanel}
          {catalogList}
        </ScreenSplit>
      ) : (
        <ScreenLayoutBody>
          {searchPanel}
          {catalogList}
        </ScreenLayoutBody>
      )}

      {isMobile ? (
        <CatalogFilterSheet
          visible={filterSheetOpen}
          filters={catalogFilters}
          onClose={() => setFilterSheetOpen(false)}
          onFiltersChange={applyCatalogFilters}
        />
      ) : null}
      <SortSheet
        visible={sortSheetOpen}
        activeSort={catalogSort}
        onClose={() => {
          setSortSheetOpen(false);
        }}
        onSortChange={applyCatalogSort}
      />

      {!splitLayout ? (
        <CardDetailDrawer
          key={selectedVariant ?? 'closed'}
          open={selectedVariant != null}
          onClose={() => {
            setSelectedVariant(null);
          }}
        >
          {selectedVariant ? (
            <CatalogDetailPanel
              variantNumber={selectedVariant}
              catalogListItem={selectedCard}
              embedded="drawer"
            />
          ) : null}
        </CardDetailDrawer>
      ) : null}
    </View>
  );
}
