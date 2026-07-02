import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardTile } from '@/components/cards/CardTile';
import { CollectionQtyControls } from '@/components/collection/CollectionQtyControls';
import { SearchBar } from '@/components/search/SearchBar';
import { Button, ButtonText } from '@/components/ui/button';
import { Chip, ChipText } from '@/components/ui/chip';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Stack } from '@/components/ui/stack';
import { Layout } from '@/constants/Layout';
import { useTheme } from '@/context/ThemeContext';
import { useCollection, useCollectionMutations } from '@/hooks/useCollection';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
  filterCollection,
  sortCollection,
  type CollectionEntry,
} from '@/services/collectionService';
import { confirmRemoveFromCollection } from '@/utils/collectionConfirm';

type SortOption = 'recent' | 'name' | 'set';

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Recent',
  name: 'Name',
  set: 'Set',
};

export default function CollectionScreen() {
  const { defaultLayout } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: collection = [], isLoading, refetch } = useCollection();
  const { setQuantity, removeCard } = useCollectionMutations();

  const collectionByVariant = useMemo(
    () => new Map(collection.map((e) => [e.variantNumber, e])),
    [collection]
  );
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const { numColumns, contentWidth, tileWidth, compact } =
    useResponsiveColumns(defaultLayout);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const entries = useMemo(() => {
    const filtered = filterCollection(collection, query);
    return sortCollection(filtered, sortBy);
  }, [collection, query, sortBy]);

  const totalCards = useMemo(
    () => collection.reduce((sum, e) => sum + e.quantity, 0),
    [collection]
  );

  const toListItem = useCallback(
    (entry: CollectionEntry) => ({
      cardId: '00000000-0000-0000-0000-000000000000',
      variantNumber: entry.variantNumber,
      name: entry.name,
      type: '',
      energy: 0,
      might: 0,
      power: 0,
      rarity: entry.rarity,
      setCode: entry.setCode,
      colors: [],
      imageUrl: entry.imageUrl,
      cardmarketId: null,
      priceEur: null,
      printings: [
        {
          variantNumber: entry.variantNumber,
          variantLabel: entry.variantLabel,
          isFoil: entry.isFoil,
          priceEur: null,
        },
      ],
    }),
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CollectionEntry; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index, 8) * 35).duration(260)}
        className={
          defaultLayout === 'grid'
            ? 'mb-2 shrink-0 grow-0 gap-2'
            : 'w-full max-w-[640px] gap-1 self-center pb-1'
        }
        style={
          defaultLayout === 'grid'
            ? { width: tileWidth, maxWidth: tileWidth }
            : undefined
        }
      >
        <CardTile
          card={toListItem(item)}
          layout={defaultLayout}
          mode="collection"
          compact={compact}
          collectionByVariant={collectionByVariant}
        />
        <View
          className={
            defaultLayout === 'list'
              ? 'mt-1 items-end pr-1'
              : 'mt-1 items-center'
          }
        >
          <CollectionQtyControls
            compact
            quantity={item.quantity}
            isFoil={item.isFoil}
            onIncrement={() => {
              void setQuantity.mutateAsync({
                variantNumber: item.variantNumber,
                quantity: item.quantity + 1,
              });
            }}
            onDecrement={() => {
              void setQuantity.mutateAsync({
                variantNumber: item.variantNumber,
                quantity: item.quantity - 1,
              });
            }}
            onRemove={() => {
              confirmRemoveFromCollection(item.name, () => {
                void removeCard.mutateAsync(item.variantNumber);
              });
            }}
          />
        </View>
      </Animated.View>
    ),
    [
      defaultLayout,
      toListItem,
      setQuantity,
      removeCard,
      tileWidth,
      compact,
      collectionByVariant,
    ]
  );

  const listHeader = (
    <Stack className="mb-4 gap-3.5 pt-3">
      <ScreenHeader
        title="Collection"
        subtitle={`${String(collection.length)} unique · ${String(totalCards)} total`}
        className="mb-0"
      />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        onClear={() => {
          setQuery('');
        }}
        placeholder="Filter collection…"
      />

      <Stack direction="row" className="flex-wrap gap-2">
        {(['recent', 'name', 'set'] as const).map((option) => (
          <Chip
            key={option}
            variant={sortBy === option ? 'default' : 'outline'}
            onPress={() => {
              setSortBy(option);
            }}
          >
            <ChipText>{SORT_LABELS[option]}</ChipText>
          </Chip>
        ))}
      </Stack>
    </Stack>
  );

  const listEmpty = (
    <Empty className="mt-12 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-1 size-16 border border-ring/30">
          <Ionicons name="albums-outline" size={32} className="text-ring" />
        </EmptyMedia>
        <EmptyTitle className="text-lg">
          {query ? 'No matching cards' : 'Your collection is empty'}
        </EmptyTitle>
        <EmptyDescription>
          {query
            ? 'Try a different filter'
            : 'Search for cards and add them to your collection'}
        </EmptyDescription>
      </EmptyHeader>
      {!query ? (
        <Button className="mt-3" onPress={() => { router.push('/(tabs)/search'); }}>
          <ButtonText>Browse cards</ButtonText>
        </Button>
      ) : null}
    </Empty>
  );

  return (
    <View className="flex-1 items-center bg-background" style={{ paddingTop: insets.top }}>
      <FlatList
        data={isLoading ? [] : entries}
        key={`${defaultLayout}-${String(numColumns)}`}
        numColumns={defaultLayout === 'grid' ? numColumns : 1}
        keyExtractor={(item) => item.variantNumber}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={!isLoading ? listEmpty : null}
        contentContainerClassName="flex-grow self-center px-4"
        contentContainerStyle={{
          width: contentWidth,
          maxWidth: '100%',
          paddingBottom: Layout.bottomPadding,
        }}
        columnWrapperStyle={
          defaultLayout === 'grid' ? { gap: Layout.gridGap } : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
