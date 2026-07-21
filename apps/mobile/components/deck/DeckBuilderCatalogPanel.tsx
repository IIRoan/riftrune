import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppLoader } from '@/components/ui/app-loader';
import {
  FlatList,
  Pressable,
  View,
  type LayoutChangeEvent,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  CatalogActiveFilterChips,
  CatalogFilterSheet,
  CatalogFilterTrigger,
} from '@/components/catalog/FilterSheet';
import { CatalogDesktopFilterBar } from '@/components/catalog/CatalogDesktopFilterBar';
import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
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
import {
  deckOwnershipBorderClass,
  ownedCountForCardName,
} from '@/lib/deck-validation';
import { openCard } from '@/utils/cardNavigation';
import { hapticPress } from '@/utils/haptics';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { cn } from '@/lib/utils';

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
  onLongPressCard,
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
  onLongPressCard: () => void;
}) {
  const canAdd = !readOnly && !blocked;
  const canRemove = !readOnly && count > 0;
  const ownershipBorder = deckOwnershipBorderClass(owned, count);

  return (
    <View style={{ width: tileWidth }} className="gap-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          readOnly
            ? `${candidate.name}${count > 0 ? `, ${count} in deck` : ''}${
                owned != null && count > 0 ? `, own ${Math.min(owned, count)} of ${count}` : ''
              }${illegal ? ', illegal' : ''}`
            : canRemove && !canAdd
              ? `Remove ${candidate.name}`
              : `Add ${candidate.name}`
        }
        accessibilityState={{ disabled: readOnly ? false : !canAdd && !canRemove }}
        className={blocked && !canRemove ? 'opacity-55' : 'active:opacity-95'}
        onPress={() => {
          if (readOnly) {
            onLongPressCard();
            return;
          }
          if (canAdd) {
            void hapticPress();
            onAdd();
            return;
          }
          if (canRemove && blocked) {
            void hapticPress();
            onRemove();
          }
        }}
        onLongPress={onLongPressCard}
      >
        <View
          className={cn(
            'relative aspect-[5/7] w-full overflow-hidden border-2 bg-background',
            CARD_ART_RADIUS_CLASS,
            ownershipBorder
              ? ownershipBorder
              : illegal
                ? 'border-destructive'
                : count > 0
                  ? 'border-primary/60'
                  : blocked
                    ? 'border-border/70'
                    : 'border-white/10'
          )}
        >
          {candidate.imageUrl ? (
            <DeckCardArt
              uri={resolveImageUrl(candidate.imageUrl)}
              variantNumber={candidate.variantNumber}
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-card-panel">
              <ThemedIonicon name="image-outline" size={20} color="muted-foreground" />
            </View>
          )}

          {illegal ? (
            <View className="absolute left-1 top-1" pointerEvents="none">
              <StatusKeywordBadge status="illegal" compact />
            </View>
          ) : null}

          {canRemove ? (
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
          ) : blocked ? (
            <View className="absolute inset-x-0 bottom-0 bg-background/80 p-1.5">
              <Text className="text-center text-[11px] font-medium text-muted-foreground">
                {blockedLabel}
              </Text>
            </View>
          ) : readOnly && count > 0 ? (
            <View className="absolute bottom-1.5 right-1.5 rounded-md bg-background/90 px-1.5 py-0.5">
              <Text className="font-mono text-[12px] font-bold text-foreground">×{count}</Text>
            </View>
          ) : readOnly ? null : (
            <View className="absolute inset-x-0 bottom-0 bg-background/65 p-1.5">
              <View className="flex-row items-center justify-center gap-1">
                <ThemedIonicon name="add" size={14} color="primary" />
                <Text className="font-semibold text-primary">Add</Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>

      <Text
        className={cn(
          'px-0.5 text-[12px] font-semibold',
          illegal ? 'text-destructive' : 'text-foreground'
        )}
        numberOfLines={2}
      >
        {candidate.name}
      </Text>
    </View>
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
          onLongPressCard={() => openCard(router, item.variantNumber, 'modal')}
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
          <ThemedIonicon name="albums-outline" size={28} color="ring" />
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
        <View className={cn('gap-2', !isMobile && 'flex-row items-center gap-3')}>
          <View className="min-w-0 flex-1">
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
            />
          </View>
          {!readOnly && isMobile ? (
            <CatalogFilterTrigger
              filters={catalogFilters}
              onPress={() => setFilterSheetOpen(true)}
              compact
              mobile
            />
          ) : null}
        </View>

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
