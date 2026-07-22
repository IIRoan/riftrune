import { useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { DeckBattlefieldPanel } from '@/components/deck/DeckBattlefieldPanel';
import { DeckIdentityHeader } from '@/components/deck/DeckIdentityHeader';
import { DeckSectionGrid } from '@/components/deck/DeckSectionGrid';
import { DeckViewInfoPanel } from '@/components/deck/DeckViewInfoPanel';
import { DeckLegalityBadge } from '@/components/deck/DeckLegalityBadge';
import { Text } from '@/components/ui/text';
import { Layout } from '@/constants/Layout';
import { deckHasBannedCards } from '@/lib/card-legality';
import { getSectionCount } from '@/lib/deck-card';
import type { DeckCard, DeckState } from '@/lib/deck-types';
import { cn } from '@/lib/utils';

const SHOWCASE_GAP = Layout.gridGap;
const SHOWCASE_TILE_MAX = 132;
const SHOWCASE_TILE_MIN = 88;
const IDENTITY_GAP = 12;
/** Space reserved so the rune summary can sit beside legend/champion. */
const RUNE_COLUMN_RESERVE = 176;

interface DeckShowcasePanelProps {
  deck: DeckState;
  imageByVariant: ReadonlyMap<string, string>;
  collectionByName: ReadonlyMap<string, number>;
  runeCardsByDomain: ReadonlyMap<string, DeckCard>;
  paddingBottom?: number;
  className?: string;
}

function computeShowcaseGrid(contentWidth: number) {
  const available = Math.max(0, contentWidth);
  let columns = Math.max(
    2,
    Math.floor((available + SHOWCASE_GAP) / (SHOWCASE_TILE_MAX + SHOWCASE_GAP))
  );
  let tileWidth = (available - SHOWCASE_GAP * (columns - 1)) / columns;
  if (tileWidth < SHOWCASE_TILE_MIN) {
    columns = Math.max(2, columns - 1);
    tileWidth = (available - SHOWCASE_GAP * (columns - 1)) / columns;
  }
  tileWidth = Math.max(SHOWCASE_TILE_MIN, Math.min(SHOWCASE_TILE_MAX, tileWidth));
  return { columns, tileWidth, gap: SHOWCASE_GAP };
}

function computeIdentityTileWidth(contentWidth: number): number {
  if (contentWidth <= 0) return 128;
  // Legend + champion share the row with the rune column.
  const forPair = contentWidth - RUNE_COLUMN_RESERVE - IDENTITY_GAP * 2;
  const perTile = Math.floor(forPair / 2);
  return Math.max(96, Math.min(148, perTile));
}

/**
 * View-only gallery of a deck — legend, runes, battlefields, main, sideboard.
 * Mirrors Piltover Archive’s Deck tab: showcase cards, no quantity editors.
 */
export function DeckShowcasePanel({
  deck,
  imageByVariant,
  collectionByName,
  runeCardsByDomain,
  paddingBottom = 0,
  className,
}: DeckShowcasePanelProps) {
  const [contentWidth, setContentWidth] = useState(0);
  const hasWidth = contentWidth > 0;
  const grid = computeShowcaseGrid(contentWidth);
  const identityTileWidth = computeIdentityTileWidth(contentWidth);
  const sideCount = getSectionCount(deck, 'sideboard');

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.floor(event.nativeEvent.layout.width);
    if (next > 0 && next !== contentWidth) setContentWidth(next);
  };

  return (
    <ScrollView
      className={cn('min-h-0 flex-1', className)}
      contentContainerStyle={{ paddingBottom, gap: 24 }}
      contentContainerClassName="px-1 py-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onLayout={onLayout}
    >
      <DeckIdentityHeader
        deck={deck}
        readOnly
        legendTileWidth={identityTileWidth}
        imageByVariant={imageByVariant}
        collectionByName={collectionByName}
        runeCardsByDomain={runeCardsByDomain}
        runePlacement={hasWidth && contentWidth < 380 ? 'below' : 'beside'}
        openSource="deck-view"
        onChangeLegend={() => undefined}
        onAddChampion={() => undefined}
        onRemoveChampion={() => undefined}
        onAdjustRune={() => undefined}
      />

      <DeckBattlefieldPanel
        deck={deck}
        readOnly
        imageByVariant={imageByVariant}
        openSource="deck-view"
        onAdd={() => undefined}
        onRemove={() => undefined}
      />

      {hasWidth ? (
        <DeckSectionGrid
          deck={deck}
          section="mainDeck"
          readOnly
          title="Main Deck"
          tileWidth={grid.tileWidth}
          gap={grid.gap}
          gridColumns={grid.columns}
          imageByVariant={imageByVariant}
          collectionByName={collectionByName}
          openSource="deck-view"
          onAdd={() => undefined}
          onMinus={() => undefined}
          onPlus={() => undefined}
          onRemove={() => undefined}
        />
      ) : null}

      {hasWidth && (sideCount > 0 || deck.addToSideboard) ? (
        <DeckSectionGrid
          deck={deck}
          section="sideboard"
          readOnly
          title="Sideboard"
          tileWidth={grid.tileWidth}
          gap={grid.gap}
          gridColumns={grid.columns}
          imageByVariant={imageByVariant}
          collectionByName={collectionByName}
          openSource="deck-view"
          onAdd={() => undefined}
          onMinus={() => undefined}
          onPlus={() => undefined}
          onRemove={() => undefined}
        />
      ) : null}

      {deck.readOnly ? (
        <DeckViewInfoPanel deck={deck} />
      ) : (
        <View className="gap-2">
          {deck.description.trim() ? (
            <View className="gap-1 rounded-lg border border-archive-soft-line/80 bg-background/40 px-2.5 py-2">
              <Text className="text-[11px] font-semibold text-muted-foreground">
                Description
              </Text>
              <Text className="text-[13px] leading-5 text-foreground">
                {deck.description.trim()}
              </Text>
            </View>
          ) : null}
          {deckHasBannedCards(deck) ? (
            <View className="self-start">
              <DeckLegalityBadge isLegal={false} />
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}
