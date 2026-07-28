import { ScrollView, View } from 'react-native';
import { DeckBattlefieldPanel } from '@/components/deck/DeckBattlefieldPanel';
import { DeckDescriptionEditor, DeckDescriptionView } from '@/components/deck/DeckDescription';
import { DeckIdentityHeader } from '@/components/deck/DeckIdentityHeader';
import { DeckViewInfoPanel } from '@/components/deck/DeckViewInfoPanel';
import { DeckLegalityBadge } from '@/components/deck/DeckLegalityBadge';
import { deckHasBannedCards } from '@/lib/card-legality';
import type { DeckCard, DeckState } from '@/lib/deck-types';

export const DECK_INFO_DRAWER_WIDTH = 280;

interface DeckBuilderInfoDrawerProps {
  deck: DeckState;
  readOnly?: boolean;
  imageByVariant: ReadonlyMap<string, string>;
  collectionByName: ReadonlyMap<string, number>;
  runeCardsByDomain: ReadonlyMap<string, DeckCard>;
  runeCardsLoading?: boolean;
  onChangeLegend: () => void;
  onRemoveLegend?: () => void;
  onAddChampion: () => void;
  onRemoveChampion: () => void;
  onAdjustRune: (domain: string, delta: number) => void;
  onAddBattlefield: () => void;
  onRemoveBattlefield: (name: string) => void;
  onAdjustBattlefield?: (name: string, delta: number) => void;
  onDescriptionChange?: (description: string) => void;
  paddingBottom?: number;
  /** When false, render as a plain column (parent owns scrolling). */
  scrollEnabled?: boolean;
}

export function DeckBuilderInfoDrawer({
  deck,
  readOnly = false,
  imageByVariant,
  collectionByName,
  runeCardsByDomain,
  runeCardsLoading = false,
  onChangeLegend,
  onRemoveLegend,
  onAddChampion,
  onRemoveChampion,
  onAdjustRune,
  onAddBattlefield,
  onRemoveBattlefield,
  onAdjustBattlefield,
  onDescriptionChange,
  paddingBottom = 0,
  scrollEnabled = true,
}: DeckBuilderInfoDrawerProps) {
  const identityInnerWidth = DECK_INFO_DRAWER_WIDTH - 32;
  const identityPairGap = 8;
  const identityPairColumns = deck.legend != null || deck.format === 'pre-rift';
  const legendTileWidth = identityPairColumns
    ? Math.floor((identityInnerWidth - identityPairGap) / 2)
    : identityInnerWidth;

  const body = (
    <>
      {readOnly ? (
        <DeckDescriptionView description={deck.description} />
      ) : onDescriptionChange ? (
        <DeckDescriptionEditor value={deck.description} onChange={onDescriptionChange} />
      ) : null}

      <DeckIdentityHeader
        deck={deck}
        readOnly={readOnly}
        legendTileWidth={legendTileWidth}
        imageByVariant={imageByVariant}
        collectionByName={collectionByName}
        runeCardsByDomain={runeCardsByDomain}
        runeCardsLoading={runeCardsLoading}
        onChangeLegend={onChangeLegend}
        onRemoveLegend={onRemoveLegend}
        onAddChampion={onAddChampion}
        onRemoveChampion={onRemoveChampion}
        onAdjustRune={onAdjustRune}
      />

      <DeckBattlefieldPanel
        deck={deck}
        readOnly={readOnly}
        imageByVariant={imageByVariant}
        onAdd={onAddBattlefield}
        onRemove={onRemoveBattlefield}
        onAdjust={onAdjustBattlefield}
      />

      {readOnly ? (
        <DeckViewInfoPanel deck={deck} />
      ) : deckHasBannedCards(deck) ? (
        <View className="self-start">
          <DeckLegalityBadge isLegal={false} />
        </View>
      ) : null}
    </>
  );

  if (!scrollEnabled) {
    return <View className="gap-4 px-3 py-3">{body}</View>;
  }

  return (
    <ScrollView
      className="min-h-0 flex-1"
      contentContainerStyle={{ paddingBottom, gap: 16 }}
      contentContainerClassName="px-3 py-3"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {body}
    </ScrollView>
  );
}
