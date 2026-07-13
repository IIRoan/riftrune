import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { DeckAddSectionStatus } from '@/components/deck/DeckAddSectionStatus';
import { DeckAddScreenHeader } from '@/components/deck/DeckAddScreenHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { defaultDeckAddSearch } from '@/lib/deck-add-catalog';
import { addCardToDeck } from '@/lib/deck-card';
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
  onLongPressCard,
  showSelected,
  selected,
  blocked,
  blockedLabel = 'Slots full',
}: {
  tileWidth: number;
  candidate: DeckCard;
  count: number;
  onAdd: () => void;
  onLongPressCard: () => void;
  showSelected: boolean;
  selected: boolean;
  blocked?: boolean;
  blockedLabel?: string;
}) {
  const pressableDisabled = (showSelected && selected) || blocked;

  return (
    <View style={{ width: tileWidth }} className="gap-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: pressableDisabled }}
        className={blocked ? 'opacity-55' : 'active:opacity-95'}
        onPress={() => {
          if (pressableDisabled) return;
          void hapticPress();
          onAdd();
        }}
        onLongPress={onLongPressCard}
      >
        <View
          className={[
            'relative aspect-[5/7] w-full overflow-hidden border bg-background',
            CARD_ART_RADIUS_CLASS,
            selected ? 'border-primary/60' : blocked ? 'border-border/70' : 'border-white/10',
          ].join(' ')}
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

          {candidate.energy > 0 ? (
            <View className="absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5">
              <Text className="font-mono text-[10px] font-bold text-foreground">
                {candidate.energy}
              </Text>
            </View>
          ) : null}

          {count > 1 ? (
            <View className="absolute right-1 top-1 rounded bg-background/90 px-1.5 py-0.5">
              <Text className="font-mono text-[10px] font-bold text-foreground">×{count}</Text>
            </View>
          ) : null}

          {pressableDisabled ? (
            <View className="absolute inset-x-0 bottom-0 bg-background/80 p-1.5">
              {selected ? (
                <View className="flex-row items-center justify-center gap-1">
                  <ThemedIonicon name="checkmark-circle" size={14} color="primary" />
                  <Text className="text-center font-semibold text-primary">In deck</Text>
                </View>
              ) : (
                <Text className="text-center text-[11px] font-medium text-muted-foreground">
                  {blockedLabel}
                </Text>
              )}
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

      {count > 0 && !pressableDisabled ? (
        <Text className="px-0.5 font-mono text-[10px] text-muted-foreground">In deck ×{count}</Text>
      ) : null}
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
          <ActivityIndicator />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout mode="flex" contentClassName="min-h-0 flex-1">
      <DeckAddScreenBody
        deck={deck}
        sectionParam={sectionParam}
        onPersist={persist}
        onFlushSave={flushSave}
      />
    </ScreenLayout>
  );
}

function DeckAddScreenBody({
  deck,
  sectionParam,
  onPersist,
  onFlushSave,
}: {
  deck: DeckState;
  sectionParam?: string;
  onPersist: (
    deck: DeckState | ((previous: DeckState) => DeckState),
    options?: { immediate?: boolean }
  ) => void;
  onFlushSave: () => Promise<DeckState | null>;
}) {
  const router = useRouter();
  const section = normalizeSectionParam(sectionParam);
  const lockedSection = Boolean(sectionParam);

  const [activeSection, setActiveSection] = useState<DeckSectionKey>(section);
  useEffect(() => setActiveSection(section), [section]);

  const { paddingBottomInline, contentWidth } = useScreenLayout();
  const { tileWidth, gap, numColumns } = useResponsiveColumns('grid', {
    measuredWidth: contentWidth,
  });

  const legendKey = deck.legend?.variantNumber ?? '';

  const [query, setQuery] = useState(() => defaultDeckAddSearch(section, deck));
  const debouncedQuery = useDebounce(query.trim(), 300);

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

  const catalog = useDeckAddCatalog(deck, activeSection, debouncedQuery);
  useDeckAutoSave(deck);

  const handleBack = useCallback(async () => {
    try {
      await onFlushSave();
    } finally {
      router.back();
    }
  }, [onFlushSave, router]);

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
          onAdd={() => handleAddOne(item)}
          onLongPressCard={() => openCard(router, item.variantNumber, 'modal')}
        />
      );
    },
    [activeSection, deck, handleAddOne, membershipRevision, router, sectionFull, tileWidth, usesSingleSelectUi]
  );

  const listFooter =
    catalog.isFetchingNextPage ? (
      <View className="items-center py-4">
        <ActivityIndicator />
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

  return (
    <View className="flex-1 gap-3">
      <DeckAddScreenHeader deck={deck} section={activeSection} onBack={() => void handleBack()} />

      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder={catalog.sectionMeta.placeholder}
        autoFocus
      />

      {catalog.sectionMeta.contextLine ? (
        <Text className="text-[12px] text-muted-foreground">{catalog.sectionMeta.contextLine}</Text>
      ) : null}

      <DeckAddSectionStatus deck={deck} section={activeSection} />

      {!lockedSection ? (
        <DeckSectionTabs
          deck={deck}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      ) : null}

      <FlatList
        data={catalog.cards}
        key={activeSection}
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
          <ActivityIndicator />
        </View>
      ) : null}
    </View>
  );
}
