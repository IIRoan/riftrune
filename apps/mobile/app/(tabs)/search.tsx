import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { CardTile } from '@/components/cards/CardTile';
import { CatalogDetailPanel } from '@/components/catalog/CatalogDetailPanel';
import {
  ActiveFilterChip,
  ALL_CARDS_FILTER,
  FilterSheet,
  FilterTrigger,
  matchesCatalogFilter,
} from '@/components/catalog/FilterSheet';
import { SortSheet, SortTrigger } from '@/components/catalog/SortSheet';
import { ViewToggle } from '@/components/catalog/ViewToggle';
import {
  DEFAULT_CATALOG_SORT,
  type CatalogSort,
} from '@/constants/catalogSort';
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
import { useCollection } from '@/hooks/useCollection';
import { useFeaturedCatalog } from '@/hooks/useFeaturedCatalog';
import { cardListItemMatchesVariant } from '@/utils/variants';
import {
  CATALOG_DETAIL_GAP,
  DETAIL_PANEL_WIDTH,
  SIDE_RAIL_WIDTH,
  useCatalogSplitLayout,
} from '@/hooks/useBreakpoint';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
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
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}) {
  return (
    <Empty className="mt-14 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-1 size-16">
          <Ionicons name={icon} size={32} className="text-ring" />
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
  const { contentWidth: layoutContentWidth, paddingBottomInline, showRail } =
    useScreenLayout();
  const [splitMainWidth, setSplitMainWidth] = useState<number | null>(null);
  const splitLayout = useCatalogSplitLayout();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [activeFilter, setActiveFilter] = useState(ALL_CARDS_FILTER);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [catalogSort, setCatalogSort] = useState<CatalogSort>(DEFAULT_CATALOG_SORT);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const {
    debouncedQuery,
    items,
    isLoading,
    isFetching,
    isError,
    minLength,
    searchNow,
  } = useCardSearch(query, catalogSort);
  const featuredQuery = useFeaturedCatalog();
  const { data: collection = [] } = useCollection();

  const collectionByVariant = useMemo(
    () => new Map(collection.map((e) => [e.variantNumber, e])),
    [collection]
  );

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

  const filteredItems = useMemo(
    () =>
      items.filter((card) => matchesCatalogFilter(card, activeFilter, collectionByVariant)),
    [items, activeFilter, collectionByVariant]
  );

  const trimmedQuery = query.trim();
  const hasSearchInput = trimmedQuery.length >= minLength;
  const searchPending = hasSearchInput && trimmedQuery !== debouncedQuery;
  const featuredFiltered = useMemo(
    () =>
      (featuredQuery.data ?? []).filter((card) =>
        matchesCatalogFilter(card, activeFilter, collectionByVariant)
      ),
    [featuredQuery.data, activeFilter, collectionByVariant]
  );
  const displayItems = hasSearchInput ? filteredItems : featuredFiltered;
  const isSearching = hasSearchInput;

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
      if (splitLayout) {
        setSelectedVariant(variantNumber);
        return;
      }
      setSelectedVariant(variantNumber);
    },
    [splitLayout]
  );

  const hasCatalog =
    displayItems.length > 0 ||
    (hasSearchInput && (searchPending || isLoading || isFetching));
  const isList = view === 'list';
  const filterActive = activeFilter !== ALL_CARDS_FILTER;

  const loadHistory = useCallback(async () => {
    setHistory(await getSearchHistory());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory])
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setShowHistory(true);
  }, []);

  const onHistoryPress = useCallback(
    async (item: SearchHistoryItem) => {
      await hapticPress();
      setQuery(item.query);
      setShowHistory(false);
      searchNow(item.query);
    },
    [searchNow]
  );

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

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof displayItems)[number]; index: number }) => {
      const tileSelected = cardListItemMatchesVariant(item, selectedVariant);
      const hideTilePrice = hasSearchInput && splitLayout && !tileSelected;

      if (isList) {
        const isFirst = index === 0;
        const isLast = index === displayItems.length - 1;
        return (
          <View
            className={cn(
              'overflow-hidden border-x border-border bg-card',
              isFirst && 'rounded-t-xl border-t',
              isLast && 'rounded-b-xl border-b',
              !isLast && 'border-b border-border'
            )}
          >
            <CardTile
              card={item}
              layout="list"
              mode="search"
              compact={compact}
              enableQuickAdd
              selected={tileSelected}
              hidePrice={hideTilePrice}
              familyContextVariantNumber={
                splitLayout && tileSelected ? selectedVariant : undefined
              }
              onPress={
                splitLayout
                  ? () => {
                      handleSelectCard(item.variantNumber);
                    }
                  : undefined
              }
              collectionByVariant={collectionByVariant}
            />
          </View>
        );
      }

      return (
        <View className="mb-1 shrink-0 grow-0" style={{ width: tileWidth, maxWidth: tileWidth }}>
          <CardTile
            card={item}
            layout="grid"
            mode="search"
            compact={compact}
            enableQuickAdd
            selected={tileSelected}
            hidePrice={hideTilePrice}
            familyContextVariantNumber={
              splitLayout && tileSelected ? selectedVariant : undefined
            }
            onPress={
              splitLayout
                ? () => {
                    handleSelectCard(item.variantNumber);
                  }
                : undefined
            }
            collectionByVariant={collectionByVariant}
          />
        </View>
      );
    },
    [isList, tileWidth, compact, collectionByVariant, displayItems.length, selectedVariant, splitLayout, handleSelectCard, hasSearchInput]
  );

  const listHeader = useMemo(() => {
    if (!hasCatalog) return null;
    return (
      <View className="mb-1 flex-row items-center justify-between pb-3">
        <View>
          <Text className="text-xl font-semibold tracking-tight text-foreground">
            Riftbound catalog
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <ViewToggle view={view} onViewChange={setView} />
          <SortTrigger
            label="Sort"
            onPress={() => {
              setSortSheetOpen(true);
            }}
          />
        </View>
      </View>
    );
  }, [hasCatalog, view, setView]);

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

    if (!isSearching && featuredQuery.isLoading) {
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
          icon="cloud-offline-outline"
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
                    <Ionicons name="time-outline" size={13} />
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
                    <Ionicons name="close" size={12} />
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
          icon="search-outline"
          title={filterActive ? 'No cards match this filter' : 'No cards found'}
          description={
            filterActive
              ? 'Try clearing the filter or a different search'
              : 'Try a different spelling or fewer keywords'
          }
        />
      );
    }

    if (!isSearching && !featuredQuery.isLoading && filterActive && featuredFiltered.length === 0) {
      return (
        <SearchEmptyState
          icon="search-outline"
          title="No cards match this filter"
          description="Try clearing the filter or search for a specific card"
        />
      );
    }

    if (trimmed.length === 0) {
      return (
        <SearchEmptyState
          icon="albums-outline"
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
    featuredQuery.isLoading,
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
    onClearAllHistory,
    onHistoryPress,
    onHistoryDelete,
  ]);

  const pageMaxWidth = splitLayout ? undefined : contentWidth;

  const searchPanel = (
    <View className="w-full pb-3 pt-2" style={{ maxWidth: pageMaxWidth }}>
      <View className="flex-col gap-3 lg:flex-row lg:items-center">
        <View className="min-w-0 flex-1">
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
        </View>

        <View className="flex-row items-center gap-2">
          <FilterTrigger
            activeFilter={activeFilter}
            onPress={() => {
              setFilterSheetOpen(true);
            }}
          />
          {filterActive ? (
            <ActiveFilterChip
              label={activeFilter}
              onClear={() => {
                setActiveFilter(ALL_CARDS_FILTER);
              }}
            />
          ) : null}
        </View>
      </View>
    </View>
  );

  const catalogList = (
    <FlatList
      data={displayItems}
      key={`${hasSearchInput ? 'search' : 'featured'}-${view}-${String(numColumns)}-${activeFilter}`}
      numColumns={isList ? 1 : numColumns}
      keyExtractor={(item) => item.variantNumber}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      contentContainerClassName={cn('flex-grow pt-1', !splitLayout && 'self-center')}
      style={splitLayout ? { flex: 1, width: '100%', maxWidth: '100%' } : undefined}
      contentContainerStyle={{
        width: splitLayout ? '100%' : contentWidth,
        maxWidth: '100%',
        paddingBottom: paddingBottomInline,
      }}
      columnWrapperStyle={
        isList ? undefined : { gap: Layout.gridGap, maxWidth: '100%' }
      }
      ListEmptyComponent={listEmpty}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    />
  );

  return (
    <>
      {splitLayout ? (
        <ScreenSplit
          asideWidth={DETAIL_PANEL_WIDTH}
          onMainWidthChange={setSplitMainWidth}
          aside={
            selectedVariant ? (
              <CatalogDetailPanel variantNumber={selectedVariant} />
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

      <FilterSheet
        visible={filterSheetOpen}
        activeFilter={activeFilter}
        onClose={() => {
          setFilterSheetOpen(false);
        }}
        onFilterChange={setActiveFilter}
      />
      <SortSheet
        visible={sortSheetOpen}
        activeSort={catalogSort}
        onClose={() => {
          setSortSheetOpen(false);
        }}
        onSortChange={setCatalogSort}
      />
    </>
  );
}
