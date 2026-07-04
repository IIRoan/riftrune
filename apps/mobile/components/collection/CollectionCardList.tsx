import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { CardTile } from '@/components/cards/CardTile';
import { Text } from '@/components/ui/text';
import type { CollectionEntry } from '@/services/collectionService';
import {
  filterCollection,
  sortCollection,
} from '@/services/collectionService';
import {
  buildCollectionByVariant,
  collectionEntryToCardListItem,
  formatGroupedCollectionMeta,
  groupCollectionByVariant,
} from '@/utils/collectionDisplay';
import { cn } from '@/lib/utils';

type SortMode = 'recent' | 'name' | 'set';

interface Props {
  entries: CollectionEntry[];
  query: string;
  isLoading?: boolean;
  contentWidth: number;
  paddingBottom: number;
  uniquePrintings: number;
  totalCopies: number;
  listHeader?: React.ReactElement | null;
}

export function CollectionCardList({
  entries,
  query,
  isLoading = false,
  contentWidth,
  paddingBottom,
  uniquePrintings,
  totalCopies,
  listHeader,
}: Props) {
  const [sortBy, setSortBy] = useState<SortMode>('recent');

  const groupedEntries = useMemo(
    () => groupCollectionByVariant(entries),
    [entries]
  );

  const rowsByVariant = useMemo(() => {
    const map = new Map<string, CollectionEntry[]>();
    for (const entry of entries) {
      const rows = map.get(entry.variantNumber) ?? [];
      rows.push(entry);
      map.set(entry.variantNumber, rows);
    }
    return map;
  }, [entries]);

  const filtered = useMemo(
    () => sortCollection(filterCollection(groupedEntries, query), sortBy),
    [groupedEntries, query, sortBy]
  );

  const collectionByVariant = useMemo(
    () => buildCollectionByVariant(entries),
    [entries]
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.variantNumber}
      ListHeaderComponent={
        <>
          {listHeader}
          <View className="mb-4 gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-sm font-semibold text-muted-foreground">
                Your cards ({uniquePrintings.toLocaleString()} printings ·{' '}
                {totalCopies.toLocaleString()} copies)
              </Text>
              <View className="flex-row gap-1">
                {(['recent', 'name', 'set'] as const).map((mode) => (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      setSortBy(mode);
                    }}
                  >
                    <Text
                      className={cn(
                        'rounded-md px-2 py-1 text-[12px] capitalize',
                        sortBy === mode
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {mode}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </>
      }
      renderItem={({ item }) => {
        const sourceRows = rowsByVariant.get(item.variantNumber) ?? [item];
        const meta = formatGroupedCollectionMeta(sourceRows);

        return (
          <View className="mb-3">
            <CardTile
              card={collectionEntryToCardListItem(item)}
              layout="list"
              mode="collection"
              compact
              collectionByVariant={collectionByVariant}
            />
            <Text className="mt-1 px-1 font-mono text-[11px] text-muted-foreground">
              {item.variantNumber} · Qty {item.quantity}
              {meta ? ` · ${meta}` : ''}
            </Text>
          </View>
        );
      }}
      ListEmptyComponent={
        !isLoading ? (
          <Text className="py-8 text-center text-sm text-muted-foreground">
            {query.trim() ? 'No cards match your search.' : 'No cards in your collection yet.'}
          </Text>
        ) : null
      }
      contentContainerStyle={{
        width: contentWidth,
        maxWidth: '100%',
        paddingBottom,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
}
