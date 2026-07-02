import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardTile } from '@/components/cards/CardTile';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchSkeleton } from '@/components/search/SearchSkeleton';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Chip, ChipIcon, ChipText } from '@/components/ui/chip';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/text';
import { Layout } from '@/constants/Layout';
import { useTheme } from '@/context/ThemeContext';
import { useCardSearch } from '@/hooks/useCardSearch';
import { useCollection } from '@/hooks/useCollection';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistoryItem,
  type SearchHistoryItem,
} from '@/services/searchHistoryService';
import { hapticPress } from '@/utils/haptics';

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
  const { defaultLayout } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  const {
    debouncedQuery,
    items,
    isLoading,
    isFetching,
    isError,
    minLength,
    searchNow,
  } = useCardSearch(query);
  const { data: collection = [] } = useCollection();

  const collectionByVariant = useMemo(
    () => new Map(collection.map((e) => [e.variantNumber, e])),
    [collection]
  );

  const { numColumns, contentWidth, tileWidth, compact } =
    useResponsiveColumns(defaultLayout);

  const hasResults = debouncedQuery.length >= minLength && items.length > 0;
  const isList = defaultLayout === 'list';

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

  const onHistoryPress = useCallback(async (item: SearchHistoryItem) => {
    await hapticPress();
    setQuery(item.query);
    setShowHistory(false);
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

  const renderItem = useCallback(
    ({ item }: { item: (typeof items)[number] }) => (
      <View
        className={isList ? 'w-full max-w-[640px] self-center' : 'mb-1 shrink-0 grow-0'}
        style={isList ? undefined : { width: tileWidth, maxWidth: tileWidth }}
      >
        <CardTile
          card={item}
          layout={defaultLayout}
          mode="search"
          compact={compact}
          enableQuickAdd
          collectionByVariant={collectionByVariant}
        />
      </View>
    ),
    [isList, tileWidth, defaultLayout, compact, collectionByVariant]
  );

  const listHeader = useMemo(() => {
    if (!hasResults) return null;
    return (
      <View className="mb-1 flex-row items-center justify-between">
        <SectionLabel className="mb-0">
          {`${String(items.length)} ${items.length === 1 ? 'card' : 'cards'}`}
        </SectionLabel>
        {isFetching ? (
          <Text className="text-xs font-medium text-muted-foreground">Updating…</Text>
        ) : null}
      </View>
    );
  }, [hasResults, items.length, isFetching]);

  const listEmpty = useMemo(() => {
    const trimmed = query.trim();

    if (isLoading || (isFetching && items.length === 0)) {
      return (
        <SearchSkeleton
          layout={defaultLayout}
          count={isList ? 8 : numColumns * 2}
          tileWidth={tileWidth}
          compact={compact}
        />
      );
    }

    if (isError) {
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

    if (showHistory && trimmed.length === 0 && history.length > 0) {
      return (
        <View className="mt-1">
          <View className="mb-3 flex-row items-center justify-between">
            <SectionLabel className="mb-0">Recent</SectionLabel>
            <Button
              variant="link"
              onPress={() => void onClearAllHistory()}
              hitSlop={8}
            >
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

    if (debouncedQuery.length >= minLength && items.length === 0 && !isFetching) {
      return (
        <SearchEmptyState
          icon="search-outline"
          title="No cards found"
          description="Try a different spelling or fewer keywords"
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
    isLoading,
    isError,
    isFetching,
    showHistory,
    history,
    debouncedQuery,
    items.length,
    minLength,
    defaultLayout,
    isList,
    numColumns,
    tileWidth,
    compact,
    onClearAllHistory,
    onHistoryPress,
    onHistoryDelete,
  ]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View
        className="w-full self-center border-b border-border px-4 pb-3.5 pt-2"
        style={{ maxWidth: contentWidth }}
      >
        <ScreenHeader title="Search" className="mb-3" />
        <SearchBar
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (text.trim().length === 0) setShowHistory(true);
            else setShowHistory(false);
          }}
          onClear={clearSearch}
          isLoading={isLoading || isFetching}
          onSubmitEditing={() => {
            searchNow();
          }}
        />
      </View>

      <FlatList
        data={debouncedQuery.length >= minLength ? items : []}
        key={`${defaultLayout}-${String(numColumns)}`}
        numColumns={isList ? 1 : numColumns}
        keyExtractor={(item) => item.variantNumber}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerClassName="flex-grow self-center px-4 pt-3"
        contentContainerStyle={{
          width: contentWidth,
          maxWidth: '100%',
          paddingBottom: Layout.bottomPadding,
        }}
        columnWrapperStyle={isList ? undefined : { gap: Layout.gridGap }}
        ListEmptyComponent={listEmpty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
