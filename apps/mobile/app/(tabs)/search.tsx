import {
  ClockIcon,
  CloudOffIcon,
  CardholderIcon,
  CardsIcon,
  SearchIcon,
  ThemedIcon,
  XIcon,
  type LucideIcon,
} from '@/components/icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import {
  FlatList,
  InteractionManager,
  Keyboard,
  Platform,
  useWindowDimensions,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import type { CardListItem } from '@riftbound/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { CardTile } from '@/components/cards/CardTile';
import { CardDetailDrawer } from '@/components/catalog/CardDetailDrawer';
import { CatalogDetailPanel } from '@/components/catalog/CatalogDetailPanel';
import { CatalogActionBar } from '@/components/catalog/CatalogActionBar';
import { CatalogDesktopFilterBar } from '@/components/catalog/CatalogDesktopFilterBar';
import {
  CatalogActiveFilterChips,
  CatalogFilterSheet,
} from '@/components/catalog/FilterSheet';
import { CatalogResultsTransition } from '@/components/catalog/CatalogResultsTransition';
import { SortSheet } from '@/components/catalog/SortSheet';
import { AppLoader } from '@/components/ui/app-loader';
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
import { SearchBar } from '@/components/search/SearchBar';
import { SearchSkeleton } from '@/components/search/SearchSkeleton';
import {
  ScreenLayout,
  ScreenLayoutBody,
  ScreenSplit,
  useScreenLayout,
} from '@/components/shell/ScreenLayout';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Chip, ChipIcon, ChipText } from '@/components/ui/chip';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Text } from '@/components/ui/text';
import { Layout } from '@/constants/Layout';
import { useTheme } from '@/context/ThemeContext';
import { useCardSearch } from '@/hooks/useCardSearch';
import { useCatalogBrowseInfinite } from '@/hooks/useCatalogBrowseInfinite';
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
import { flushCardDetailPrefetch, prefetchCardDetail } from '@/lib/prefetchCardDetail';
import {
  catalogLookaheadCount,
  catalogViewportTargetHeight,
  estimateCatalogPageSize,
  estimateCatalogRowHeight,
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
import { cn } from '@/lib/utils';

function SearchEmptyState({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <Empty className="mt-14 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-1 size-16">
          <ThemedIcon icon={icon} size={32} color="ring" />
        </EmptyMedia>
        <EmptyTitle className="text-lg">{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
    </Empty>
  );
}

export default function SearchScreen() {
  return (
    <ScreenLayout mode="flex" contentClassName="flex-1">
      <SearchScreenBody />
    </ScreenLayout>
  );
}

function SearchScreenBody() {
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
  const catalogListRef = useRef<FlatList<CardListItem>>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;
  const onViewableItemsChangedRef = useRef<
    (info: { viewableItems: ViewToken<CardListItem>[] }) => void
  >(() => {});

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
  const displayItemsRef = useRef(displayItems);
  displayItemsRef.current = displayItems;
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
        void flushCardDetailPrefetch();
      }
      setSelectedVariant(variantNumber);
    },
    [queryClient]
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
    [isList, numColumns, queryClient, selectedVariant, queueOwnershipFetch]
  );

  onViewableItemsChangedRef.current = onViewableItemsChanged;

  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken<CardListItem>[] }) => {
      onViewableItemsChangedRef.current(info);
    },
    []
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

  const gridCellStyle = useMemo(
    () => ({ width: tileWidth, maxWidth: tileWidth }),
    [tileWidth]
  );

  const listRowHeight = useMemo(
    () => estimateCatalogRowHeight('list', tileWidth, compact),
    [tileWidth, compact]
  );

  const getListItemLayout = useCallback(
    (_data: ArrayLike<CardListItem> | null | undefined, index: number) => ({
      length: listRowHeight,
      offset: listRowHeight * index,
      index,
    }),
    [listRowHeight]
  );

  const renderItem = useCallback<ListRenderItem<CardListItem>>(
    ({ item, index }) => {
      const tileSelected = cardListItemMatchesVariant(item, selectedVariant);
      // Always scope prices/quick-add to this row's printing family so
      // overnumbered / alt art tiles show their own Cardmarket price.
      const familyContextVariantNumber =
        splitLayout && tileSelected ? selectedVariant : item.variantNumber;

      if (isList) {
        const isLast = index === displayItemsRef.current.length - 1;
        return (
          <View className={cn(!isLast && 'border-b border-border')}>
            <CardTile
              card={item}
              layout="list"
              mode="search"
              compact={compact}
              enableQuickAdd
              selected={tileSelected}
              collectionByVariant={collectionByVariant}
              familyContextVariantNumber={familyContextVariantNumber}
              onSelectVariant={handleSelectCard}
            />
          </View>
        );
      }

      return (
        <View
          className="mb-1 shrink-0 grow-0"
          style={gridCellStyle}
          collapsable={false}
        >
          <CardTile
            card={item}
            layout="grid"
            mode="search"
            compact={compact}
            enableQuickAdd
            selected={tileSelected}
            collectionByVariant={collectionByVariant}
            familyContextVariantNumber={familyContextVariantNumber}
            onSelectVariant={handleSelectCard}
          />
        </View>
      );
    },
    [
      isList,
      gridCellStyle,
      compact,
      selectedVariant,
      splitLayout,
      handleSelectCard,
      collectionByVariant,
    ]
  );

  const listExtraData = useMemo(
    () => ({
      selectedVariant,
      // FlatList skips cell updates unless extraData changes — ownership must be included
      // or tiles keep showing Add after collection mutations.
      ownership: collectionByVariant,
    }),
    [selectedVariant, collectionByVariant]
  );

  const listContentStyle = useMemo(
    () => ({
      width: splitLayout ? ('100%' as const) : contentWidth,
      maxWidth: '100%' as const,
      flexGrow: displayItems.length === 0 ? 1 : undefined,
    }),
    [splitLayout, contentWidth, displayItems.length]
  );

  const listFooter = useMemo(
    () => <View style={{ height: paddingBottomInline }} />,
    [paddingBottomInline]
  );

  const columnWrapperStyle = useMemo(
    () => (isList ? undefined : { gap: Layout.gridGap, maxWidth: '100%' as const }),
    [isList]
  );

  const listEmpty = useMemo(() => {
    const trimmed = query.trim();

    if (isSearching && (searchPending || isLoading || (isFetching && items.length === 0))) {
      return (
        <SearchSkeleton
          layout={view}
          count={isList ? 8 : numColumns * 2}
          tileWidth={tileWidth}
          compact={compact}
        />
      );
    }

    if (!isSearching && browseCatalog.isLoading) {
      return (
        <SearchSkeleton
          layout={view}
          count={isList ? 8 : numColumns * 2}
          tileWidth={tileWidth}
          compact={compact}
        />
      );
    }

    if (isSearching && isError) {
      return (
        <SearchEmptyState
          icon={CloudOffIcon}
          title="Could not load cards"
          description="Check that the API is running and EXPO_PUBLIC_API_URL is set."
        />
      );
    }

    if (trimmed.length > 0 && trimmed.length < minLength) {
      return (
        <Empty className="mt-14 border-0">
          <EmptyDescription>
            Type at least {minLength} characters to search
          </EmptyDescription>
        </Empty>
      );
    }

    if (showHistory && trimmed.length === 0 && history.length > 0 && !hasCatalog) {
      return (
        <View className="mt-1">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-muted-foreground">Recent</Text>
            <Button variant="link" onPress={() => void onClearAllHistory()} hitSlop={8}>
              <ButtonText className="text-sm">Clear</ButtonText>
            </Button>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {history.map((item) => (
              <View key={`${item.query}-${String(item.timestamp)}`} className="flex-row items-center">
                <Chip variant="outline" onPress={() => void onHistoryPress(item)}>
                  <ChipIcon>
                    <ClockIcon className="size-[13px] text-foreground" />
                  </ChipIcon>
                  <ChipText className="max-w-[180px]">{item.query}</ChipText>
                </Chip>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="ml-1 size-[22px] rounded-full bg-transparent"
                  onPress={() => void onHistoryDelete(item)}
                  hitSlop={6}
                  accessibilityLabel="Remove from history"
                >
                  <ButtonIcon className="text-muted-foreground">
                    <XIcon className="size-[12px] text-foreground" />
                  </ButtonIcon>
                </Button>
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (isSearching && !searchPending && !isFetching && filteredItems.length === 0) {
      return (
        <SearchEmptyState
          icon={SearchIcon}
          title={filterActive ? 'No cards match this filter' : 'No cards found'}
          description={
            filterActive
              ? 'Try clearing the filter or a different search'
              : 'Try a different spelling or fewer keywords'
          }
        />
      );
    }

    if (!isSearching && !browseCatalog.isLoading && filterActive && featuredFiltered.length === 0) {
      if (ownedFilterActive) {
        return (
          <SearchEmptyState
            icon={CardholderIcon}
            title={
              catalogFiltersActive({ ...catalogFilters, collection: 'all' })
                ? 'No owned cards match this filter'
                : 'No cards in your collection yet'
            }
            description={
              catalogFiltersActive({ ...catalogFilters, collection: 'all' })
                ? 'Try clearing other filters or search for a specific card'
                : 'Add cards from the catalog or import your collection'
            }
          />
        );
      }

      return (
        <SearchEmptyState
          icon={SearchIcon}
          title="No cards match this filter"
          description="Try clearing the filter or search for a specific card"
        />
      );
    }

    if (trimmed.length === 0) {
      return (
        <SearchEmptyState
          icon={CardsIcon}
          title="Find your cards"
          description="Search by name, variant number, type, or tags"
        />
      );
    }

    return null;
  }, [
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
  ]);

  const pageMaxWidth = splitLayout ? undefined : contentWidth;

  const searchPanel = (
    <View className="w-full gap-1.5 pb-2 pt-2" style={{ maxWidth: pageMaxWidth }}>
      <SearchBar
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          if (text.trim().length === 0) {
            setShowHistory(true);
          } else {
            setShowHistory(false);
          }
        }}
        onClear={clearSearch}
        isLoading={hasSearchInput && (searchPending || isLoading || isFetching)}
        placeholder="Search cards, artists, tags, or set numbers"
        onSubmitEditing={() => {
          searchNow();
        }}
      />

      {isMobile && filterActive ? (
        <CatalogActiveFilterChips
          filters={catalogFilters}
          onFiltersChange={applyCatalogFilters}
        />
      ) : null}

      {!isMobile ? (
        <CatalogDesktopFilterBar
          filters={catalogFilters}
          onFiltersChange={applyCatalogFilters}
        />
      ) : null}

      {!isMobile && filterActive ? (
        <CatalogActiveFilterChips
          filters={catalogFilters}
          onFiltersChange={applyCatalogFilters}
        />
      ) : null}

      <CatalogActionBar
        view={view}
        onViewChange={setView}
        activeSort={catalogSort}
        onSortPress={() => {
          setSortSheetOpen(true);
        }}
        filters={catalogFilters}
        onFilterPress={() => setFilterSheetOpen(true)}
        collection={catalogFilters.collection}
        onCollectionChange={(collection) =>
          applyCatalogFilters({ ...catalogFilters, collection })
        }
        showFilterTrigger={isMobile}
      />
    </View>
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

  const catalogList = (
    <View className="relative min-h-0 flex-1">
      <CatalogResultsTransition transitionKey={resultsTransitionKey}>
        <View
          className={cn(
            'min-h-0 flex-1',
            isList &&
              displayItems.length > 0 &&
              !sortPending &&
              'overflow-hidden rounded-xl border border-border bg-card'
          )}
        >
          <FlatList
          ref={catalogListRef}
          data={displayItems}
          key={`${hasSearchInput ? 'search' : 'featured'}-${view}-${String(numColumns)}`}
          numColumns={isList ? 1 : numColumns}
          keyExtractor={(item) => item.variantNumber}
          renderItem={renderItem}
          extraData={listExtraData}
          ListHeaderComponent={null}
          ListFooterComponent={listFooter}
          contentContainerClassName={cn('flex-grow', !splitLayout && 'self-center')}
          style={splitLayout ? { flex: 1, width: '100%', maxWidth: '100%' } : { flex: 1 }}
          contentContainerStyle={listContentStyle}
          columnWrapperStyle={columnWrapperStyle}
          ListEmptyComponent={listEmpty}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={dismissKeyboard}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScroll={handleCatalogScroll}
          scrollEventThrottle={16}
          onEndReached={fetchMoreCatalog}
          onEndReachedThreshold={1.75}
          onContentSizeChange={(_, height) => {
            maybeFillCatalogViewport(height);
          }}
          getItemLayout={isList ? getListItemLayout : undefined}
          initialNumToRender={Math.min(displayItems.length || pageSize, pageSize)}
          maxToRenderPerBatch={16}
          windowSize={9}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS !== 'web'}
          showsVerticalScrollIndicator={false}
          />
        </View>
      </CatalogResultsTransition>
      {sortPending ? (
        <View
          className="absolute inset-0 items-center justify-center bg-background"
          pointerEvents="none"
          accessibilityLabel="Sorting cards"
        >
          <AppLoader size="lg" />
        </View>
      ) : null}
    </View>
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
