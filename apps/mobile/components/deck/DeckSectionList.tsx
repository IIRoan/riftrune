import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  View,
  type ListRenderItem,
} from 'react-native';
import { DeckQtyControl } from '@/components/deck/DeckQtyControl';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { useScreenLayout } from '@/components/shell/ScreenLayout';
import { useDeckCardImages } from '@/hooks/useDeckCardImages';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
  getDeckVariantNumbers,
  getSectionCount,
  resolveDeckCardImageUrl,
} from '@/lib/deck-card';
import type { DeckCard, DeckEntry, DeckSectionKey } from '@/lib/deck-types';
import { DECK_SECTIONS } from '@/lib/deck-types';
import type { DeckState } from '@/lib/deck-types';
import { ownedCountForCardName } from '@/lib/deck-validation';
import { openCard } from '@/utils/cardNavigation';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface DeckSectionListProps {
  deck: DeckState;
  activeSection: DeckSectionKey;
  onSectionChange: (section: DeckSectionKey) => void;
  onRemove: (section: DeckSectionKey, name?: string) => void;
  onChangeQty: (
    section: Exclude<DeckSectionKey, 'legend' | 'champion'>,
    name: string,
    delta: number
  ) => void;
  onToggleSideboard?: () => void;
  onBrowseCards?: () => void;
  collectionByName?: ReadonlyMap<string, number>;
  paddingBottom?: number;
}

type SectionRow = {
  name: string;
  entry?: DeckEntry;
  card: DeckCard;
};

function sectionLabel(
  deck: DeckState,
  section: (typeof DECK_SECTIONS)[number]
): string {
  const count = getSectionCount(deck, section.key);
  if (section.optional) return `${section.title} ${count}/${section.target}`;
  if (section.isMin) return `${section.title} ${count}/${section.target}+`;
  if (section.single) return `${section.title} ${count}/${section.target}`;
  return `${section.title} ${count}/${section.target}`;
}

export function DeckSectionTabs({
  deck,
  activeSection,
  onSectionChange,
}: Pick<DeckSectionListProps, 'deck' | 'activeSection' | 'onSectionChange'>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-1.5 pr-2"
      className="max-h-10"
    >
      {DECK_SECTIONS.map((section) => {
        const selected = activeSection === section.key;
        const count = getSectionCount(deck, section.key);
        const complete =
          section.single || section.isMin
            ? count >= section.target
            : count === section.target;

        return (
          <Pressable
            key={section.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              hapticPress();
              onSectionChange(section.key);
            }}
            className={cn(
              'rounded-lg px-3 py-2 active:opacity-90',
              selected ? 'bg-primary/15' : 'bg-card-panel active:bg-card'
            )}
          >
            <Text
              className={cn(
                'text-[12px] font-semibold',
                selected ? 'text-primary' : 'text-muted-foreground',
                !selected && complete && count > 0 && 'text-success'
              )}
            >
              {sectionLabel(deck, section)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function DeckFeaturedCard({
  card,
  imageUri,
  owned,
  single,
  onRemove,
}: {
  card: DeckCard;
  imageUri: string;
  owned: number | null;
  single?: boolean;
  onRemove: () => void;
}) {
  const router = useRouter();

  return (
    <View className="items-center gap-4 rounded-xl border border-archive-soft-line bg-card p-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${card.name}`}
        className="active:opacity-90"
        onPress={() => {
          hapticPress();
          openCard(router, card.variantNumber, 'modal');
        }}
      >
        <View
          className={cn(
            'overflow-hidden border border-white/10 bg-background ring-1 ring-white/5',
            CARD_ART_RADIUS_CLASS
          )}
          style={{ width: 160, height: 224 }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              recyclingKey={card.variantNumber}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              contentPosition="top"
              transition={120}
              cachePolicy="memory-disk"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-card-panel">
              <ThemedIonicon name="image-outline" size={32} color="muted-foreground" />
            </View>
          )}
        </View>
      </Pressable>

      <View className="w-full items-center gap-1">
        <Text className="text-center text-base font-semibold text-foreground">{card.name}</Text>
        <Text className="font-mono text-[12px] text-muted-foreground">
          {card.variantNumber} · {card.rarity}
          {card.energy > 0 ? ` · ${card.energy} energy` : ''}
        </Text>
        {owned != null ? (
          <Text
            className={cn(
              'font-mono text-[11px]',
              owned < 1 ? 'text-warning' : 'text-success'
            )}
          >
            Owned {owned}
          </Text>
        ) : null}
      </View>

      <View className="w-full max-w-xs">
        <DeckQtyControl
          count={1}
          name={card.name}
          single={single}
          onRemove={onRemove}
        />
      </View>
    </View>
  );
}

function DeckGridCard({
  card,
  count,
  imageUri,
  owned,
  tileWidth,
  single,
  onMinus,
  onPlus,
  onRemove,
}: {
  card: DeckCard;
  count: number;
  imageUri: string;
  owned: number | null;
  tileWidth: number;
  single?: boolean;
  onMinus?: () => void;
  onPlus?: () => void;
  onRemove: () => void;
}) {
  const router = useRouter();
  const shortfall = owned != null && owned < count;

  return (
    <View style={{ width: tileWidth }} className="gap-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${card.name}`}
        className="active:opacity-90"
        onPress={() => {
          hapticPress();
          openCard(router, card.variantNumber, 'modal');
        }}
      >
        <View
          className={cn(
            'relative aspect-[5/7] w-full overflow-hidden border border-white/10 bg-background',
            CARD_ART_RADIUS_CLASS,
            shortfall && 'border-warning/50'
          )}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              recyclingKey={card.variantNumber}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              contentFit="cover"
              contentPosition="top"
              transition={120}
              cachePolicy="memory-disk"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-card-panel">
              <ThemedIonicon name="image-outline" size={20} color="muted-foreground" />
            </View>
          )}
          {card.energy > 0 ? (
            <View className="absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5">
              <Text className="font-mono text-[10px] font-bold text-foreground">{card.energy}</Text>
            </View>
          ) : null}
          {count > 1 ? (
            <View className="absolute right-1 top-1 rounded bg-background/90 px-1.5 py-0.5">
              <Text className="font-mono text-[10px] font-bold text-foreground">×{count}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <Text className="px-0.5 text-[12px] font-semibold text-foreground" numberOfLines={2}>
        {card.name}
      </Text>
      {owned != null ? (
        <Text
          className={cn(
            'px-0.5 font-mono text-[10px]',
            shortfall ? 'text-warning' : 'text-success'
          )}
        >
          Owned {Math.min(owned, count)}/{count}
        </Text>
      ) : null}

      <DeckQtyControl
        count={count}
        name={card.name}
        single={single}
        onMinus={onMinus}
        onPlus={onPlus}
        onRemove={onRemove}
      />
    </View>
  );
}

export function DeckSectionList({
  deck,
  activeSection,
  onRemove,
  onChangeQty,
  onToggleSideboard,
  onBrowseCards,
  collectionByName,
  paddingBottom = 0,
}: Omit<DeckSectionListProps, 'onSectionChange'>) {
  const { contentWidth } = useScreenLayout();
  const { numColumns, tileWidth, gap } = useResponsiveColumns('grid', { measuredWidth: contentWidth });

  const variantNumbers = useMemo(() => getDeckVariantNumbers(deck), [deck]);
  const { data: imageByVariant = new Map<string, string>() } = useDeckCardImages(variantNumbers);

  const sectionMeta = DECK_SECTIONS.find((section) => section.key === activeSection);
  const entries = useMemo((): SectionRow[] => {
    if (activeSection === 'legend' && deck.legend) {
      return [{ name: deck.legend.name, card: deck.legend }];
    }
    if (activeSection === 'champion' && deck.champion) {
      return [{ name: deck.champion.name, card: deck.champion }];
    }
    if (activeSection === 'legend' || activeSection === 'champion') {
      return [];
    }

    const sorted = [...deck[activeSection].entries()].sort((a, b) => {
      const costA = a[1].card.energy;
      const costB = b[1].card.energy;
      if (costA !== costB) return costA - costB;
      return a[0].localeCompare(b[0]);
    });

    return sorted.map(([name, entry]) => ({ name, entry, card: entry.card }));
  }, [activeSection, deck]);

  if (!sectionMeta) return null;

  const isFeatured = sectionMeta.single && entries.length === 1;
  const listColumns = isFeatured ? 1 : numColumns;

  const renderItem: ListRenderItem<SectionRow> = ({ item }) => {
    const { name, entry, card } = item;
    const count = entry?.count ?? 1;
    const owned = ownedCountForCardName(name, collectionByName ?? new Map());
    const imageUri = resolveDeckCardImageUrl(card, imageByVariant);

    if (isFeatured) {
      return (
        <DeckFeaturedCard
          card={card}
          imageUri={imageUri}
          owned={owned}
          single={sectionMeta.single}
          onRemove={() => onRemove(activeSection, name)}
        />
      );
    }

    return (
      <DeckGridCard
        card={card}
        count={count}
        imageUri={imageUri}
        owned={owned}
        tileWidth={tileWidth}
        single={sectionMeta.single}
        onMinus={
          entry
            ? () =>
                onChangeQty(
                  activeSection as Exclude<DeckSectionKey, 'legend' | 'champion'>,
                  name,
                  -1
                )
            : undefined
        }
        onPlus={
          entry
            ? () =>
                onChangeQty(
                  activeSection as Exclude<DeckSectionKey, 'legend' | 'champion'>,
                  name,
                  1
                )
            : undefined
        }
        onRemove={() => onRemove(activeSection, name)}
      />
    );
  };

  const listHeader = (
    <View className="mb-4 gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-foreground">{sectionMeta.title}</Text>
          <Text className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {sectionLabel(deck, sectionMeta)}
          </Text>
        </View>
        {activeSection === 'sideboard' && onToggleSideboard ? (
          <Button
            variant={deck.addToSideboard ? 'default' : 'outline'}
            size="sm"
            onPress={onToggleSideboard}
            disabled={getSectionCount(deck, 'sideboard') >= 8}
          >
            <ButtonText>{deck.addToSideboard ? 'Sideboard mode' : 'Add to sideboard'}</ButtonText>
          </Button>
        ) : onBrowseCards ? (
          <Button variant="outline" size="sm" onPress={onBrowseCards}>
            <ButtonText>Add cards</ButtonText>
          </Button>
        ) : null}
      </View>
    </View>
  );

  const emptyState = (
    <Empty className="border border-dashed border-border py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-1 size-14">
          <ThemedIonicon name="albums-outline" size={28} color="ring" />
        </EmptyMedia>
        <EmptyTitle>No cards yet</EmptyTitle>
        <EmptyDescription>
          Browse the catalog to add cards to your {sectionMeta.title.toLowerCase()}.
        </EmptyDescription>
      </EmptyHeader>
      {onBrowseCards ? (
        <Button onPress={onBrowseCards}>
          <ButtonText>Browse cards</ButtonText>
        </Button>
      ) : null}
    </Empty>
  );

  return (
    <FlatList
      data={entries}
      key={`${activeSection}-${listColumns}`}
      keyExtractor={(item) => item.name}
      numColumns={listColumns}
      columnWrapperStyle={
        listColumns > 1 ? { gap, marginBottom: gap } : undefined
      }
      contentContainerStyle={{
        paddingBottom,
        flexGrow: entries.length === 0 ? 1 : undefined,
      }}
      contentContainerClassName={entries.length === 0 ? 'flex-1' : undefined}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={emptyState}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      className="min-h-0 flex-1"
    />
  );
}
