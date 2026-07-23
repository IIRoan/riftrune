import { ThemedIcon, SearchIcon } from '@/components/icons';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppLoader } from '@/components/ui/app-loader';
import type { CardListItem } from '@riftbound/contracts';
import { useQuery } from '@tanstack/react-query';
import { CardTile } from '@/components/cards/CardTile';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { SearchInput } from '@/components/ui/search-input';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useDebounce } from '@/hooks/useDebounce';
import { catalogQueryForSection } from '@/hooks/useDeckCardResolver';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { deckCardFromDetail } from '@/lib/deck-card';
import type { DeckCard, DeckSectionKey } from '@/lib/deck-types';
import { DECK_SECTIONS } from '@/lib/deck-types';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';
import { hapticPress } from '@/utils/haptics';
import { toast } from '@/components/ui/toast';
import type { CollectionEntry } from '@/services/collectionService';

interface DeckCardPickerSheetProps {
  open: boolean;
  section: DeckSectionKey;
  onClose: () => void;
  onSelect: (card: DeckCard) => void;
  collectionByVariant?: ReadonlyMap<string, CollectionEntry>;
}

export function DeckCardPickerSheet({
  open,
  section,
  onClose,
  onSelect,
  collectionByVariant,
}: DeckCardPickerSheetProps) {
  const reduceMotion = useReduceMotion();
  const { tileWidth, gap } = useResponsiveColumns('grid');
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query.trim(), 300);
  const sectionFilter = catalogQueryForSection(section);
  const sectionTitle = DECK_SECTIONS.find((item) => item.key === section)?.title ?? 'deck';

  const cardsQuery = useQuery({
    queryKey: cardQueryKeys.search(
      debounced || `deck-section:${section}`,
      40,
      'name',
      'asc'
    ),
    queryFn: async () => {
      const response = await api.listCards({
        q: debounced || undefined,
        limit: 40,
        page: 1,
        sortBy: 'name',
        dir: 'asc',
        ...sectionFilter,
      });
      return response;
    },
    enabled: open,
    staleTime: 60_000,
  });

  const cards = useMemo(() => {
    const rows = cardsQuery.data?.data ?? [];
    if (section === 'champion') {
      return rows.filter((card) => card.type === 'Unit');
    }
    if (section === 'mainDeck' || section === 'sideboard') {
      return rows.filter(
        (card) => !['Legend', 'Battlefield', 'Rune'].includes(card.type)
      );
    }
    return rows;
  }, [cardsQuery.data, section]);

  const handleSelect = async (card: CardListItem) => {
    hapticPress();
    try {
      const detail = await api.getCard(card.variantNumber);
      const deckCard = deckCardFromDetail(detail.data, card.variantNumber);

      if (section === 'champion' && (deckCard.super ?? '').toLowerCase() !== 'champion') {
        toast.error('Chosen Champion must be a Champion Unit.');
        return;
      }

      onSelect(deckCard);
      onClose();
    } catch {
      toast.error('Could not load card details.');
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <BottomSheetPortal name="deck-card-picker">
        <BottomSheetOverlay />
        <BottomSheetContent
          snapPoints={reduceMotion ? ['92%'] : ['70%', '92%']}
          defaultSnapIndex={0}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
        >
          <BottomSheetHeader>
            <BottomSheetTitle>Add to {sectionTitle}</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetScrollView contentContainerClassName="gap-4 px-4 pb-8">
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${sectionTitle.toLowerCase()} cards`}
              autoFocus
            />

            {cardsQuery.isLoading ? (
              <View className="items-center py-10">
                <AppLoader size="md" />
              </View>
            ) : cards.length === 0 ? (
              <Empty className="border border-dashed border-border py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="mb-1 size-14">
                    <ThemedIcon icon={SearchIcon} size={28} color="ring" />
                  </EmptyMedia>
                  <EmptyTitle>No matches</EmptyTitle>
                  <EmptyDescription>
                    Try another name or check the active deck section.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <View className="flex-row flex-wrap" style={{ gap }}>
                {cards.map((card) => (
                  <View key={card.variantNumber} style={{ width: tileWidth }}>
                    <CardTile
                      card={card}
                      layout="grid"
                      compact
                      hidePrice
                      enableQuickAdd={false}
                      onPress={() => {
                        void handleSelect(card);
                      }}
                      collectionByVariant={collectionByVariant}
                    />
                  </View>
                ))}
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
