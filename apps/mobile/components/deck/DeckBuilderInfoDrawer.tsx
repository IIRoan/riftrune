import { ScrollView, View } from 'react-native';
import { DeckBattlefieldPanel } from '@/components/deck/DeckBattlefieldPanel';
import { DeckIdentityHeader } from '@/components/deck/DeckIdentityHeader';
import { DeckViewInfoPanel } from '@/components/deck/DeckViewInfoPanel';
import { DeckLegalityBadge } from '@/components/deck/DeckLegalityBadge';
import { Text } from '@/components/ui/text';
import { TextareaInput } from '@/components/ui/textarea-input';
import { deckHasBannedCards } from '@/lib/card-legality';
import type { DeckCard, DeckState } from '@/lib/deck-types';

export const DECK_INFO_DRAWER_WIDTH = 280;

interface DeckBuilderInfoDrawerProps {
  deck: DeckState;
  readOnly?: boolean;
  imageByVariant: ReadonlyMap<string, string>;
  collectionByName: ReadonlyMap<string, number>;
  runeCardsByDomain: ReadonlyMap<string, DeckCard>;
  onChangeLegend: () => void;
  onAddChampion: () => void;
  onRemoveChampion: () => void;
  onAdjustRune: (domain: string, delta: number) => void;
  onAddBattlefield: () => void;
  onRemoveBattlefield: (name: string) => void;
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
  onChangeLegend,
  onAddChampion,
  onRemoveChampion,
  onAdjustRune,
  onAddBattlefield,
  onRemoveBattlefield,
  onDescriptionChange,
  paddingBottom = 0,
  scrollEnabled = true,
}: DeckBuilderInfoDrawerProps) {
  const identityInnerWidth = DECK_INFO_DRAWER_WIDTH - 32;
  const identityPairGap = 8;
  const legendTileWidth = deck.legend
    ? Math.floor((identityInnerWidth - identityPairGap) / 2)
    : identityInnerWidth;

  const body = (
    <>
      <View className="gap-3">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Identity
        </Text>
        <DeckIdentityHeader
          deck={deck}
          readOnly={readOnly}
          legendTileWidth={legendTileWidth}
          imageByVariant={imageByVariant}
          collectionByName={collectionByName}
          runeCardsByDomain={runeCardsByDomain}
          onChangeLegend={onChangeLegend}
          onAddChampion={onAddChampion}
          onRemoveChampion={onRemoveChampion}
          onAdjustRune={onAdjustRune}
        />
      </View>

      <DeckBattlefieldPanel
        deck={deck}
        readOnly={readOnly}
        imageByVariant={imageByVariant}
        onAdd={onAddBattlefield}
        onRemove={onRemoveBattlefield}
      />

      {readOnly ? (
        <DeckViewInfoPanel deck={deck} />
      ) : (
        <View className="gap-2">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </Text>
          <TextareaInput
            value={deck.description}
            onChangeText={onDescriptionChange}
            placeholder="Deck description (optional)"
          />
          {deckHasBannedCards(deck) ? (
            <View className="self-start">
              <DeckLegalityBadge isLegal={false} />
            </View>
          ) : null}
        </View>
      )}
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
