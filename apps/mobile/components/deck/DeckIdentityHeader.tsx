import type { ReactNode } from 'react';
import { View } from 'react-native';
import { DeckCardSlot, resolveSlotImage } from '@/components/deck/DeckCardSlot';
import { DeckRunePanel } from '@/components/deck/DeckRunePanel';
import { Text } from '@/components/ui/text';
import { isCardTournamentIllegal } from '@/lib/card-legality';
import type { DeckCard, DeckState } from '@/lib/deck-types';
import { ownedCountForCardName } from '@/lib/deck-validation';
import type { CardOpenSource } from '@/utils/cardNavigation';
import { cn } from '@/lib/utils';

interface DeckIdentityHeaderProps {
  deck: DeckState;
  readOnly?: boolean;
  legendTileWidth: number;
  imageByVariant: ReadonlyMap<string, string>;
  collectionByName: ReadonlyMap<string, number>;
  runeCardsByDomain: ReadonlyMap<string, DeckCard>;
  onChangeLegend: () => void;
  onAddChampion: () => void;
  onRemoveChampion: () => void;
  onAdjustRune: (domain: string, delta: number) => void;
  /** Place runes under identity (drawer) or to the right (showcase). */
  runePlacement?: 'below' | 'beside';
  openSource?: CardOpenSource;
}

function IdentitySlotBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('min-w-0 gap-2', className)}>
      <Text className="text-[13px] font-semibold leading-4 text-foreground" numberOfLines={1}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function DeckIdentityHeader({
  deck,
  readOnly = false,
  legendTileWidth,
  imageByVariant,
  collectionByName,
  runeCardsByDomain,
  onChangeLegend,
  onAddChampion,
  onRemoveChampion,
  onAdjustRune,
  runePlacement = 'below',
  openSource,
}: DeckIdentityHeaderProps) {
  const legend = deck.legend;
  const tileWidth = legendTileWidth;
  const runesBeside = runePlacement === 'beside';

  const legendSlot = legend ? (
    <DeckCardSlot
      variant="card"
      tileWidth={tileWidth}
      card={legend}
      imageUri={resolveSlotImage(legend, imageByVariant)}
      owned={ownedCountForCardName(legend.name, collectionByName)}
      illegal={isCardTournamentIllegal(legend, deck)}
      single
      openSource={openSource}
      onPress={readOnly ? undefined : onChangeLegend}
      onRemove={readOnly ? undefined : onChangeLegend}
    />
  ) : (
    <DeckCardSlot
      variant="identity"
      tileWidth={tileWidth}
      label="Choose Legend"
      onAdd={readOnly ? undefined : onChangeLegend}
    />
  );

  const championSlot =
    legend &&
    (deck.champion ? (
      <DeckCardSlot
        variant="card"
        tileWidth={tileWidth}
        card={deck.champion}
        imageUri={resolveSlotImage(deck.champion, imageByVariant)}
        owned={ownedCountForCardName(deck.champion.name, collectionByName)}
        illegal={isCardTournamentIllegal(deck.champion, deck)}
        single
        openSource={openSource}
        onAdd={readOnly ? undefined : onAddChampion}
        onRemove={readOnly ? undefined : onRemoveChampion}
      />
    ) : (
      <DeckCardSlot
        variant="identity"
        tileWidth={tileWidth}
        label="Add Champion"
        onAdd={readOnly ? undefined : onAddChampion}
      />
    ));

  const runePanel = legend ? (
    <DeckRunePanel
      deck={deck}
      readOnly={readOnly}
      runeCardsByDomain={runeCardsByDomain}
      onAdjust={onAdjustRune}
      dense
      compact={runesBeside}
    />
  ) : null;

  if (runesBeside && runePanel) {
    // Two columns: legend+champion pair on the left, rune summary on the right.
    // Align to the bottom of the card art so the rune block sits next to the tiles.
    return (
      <View className="flex-row items-end gap-4">
        <View className="flex-row gap-3">
          <IdentitySlotBlock title="Legend">{legendSlot}</IdentitySlotBlock>
          {legend ? (
            <IdentitySlotBlock title="Champion">{championSlot}</IdentitySlotBlock>
          ) : null}
        </View>
        <View className="min-w-[11rem] max-w-[15rem] flex-1 pb-1">{runePanel}</View>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-stretch gap-2">
        <IdentitySlotBlock title="Legend" className="flex-1">
          {legendSlot}
        </IdentitySlotBlock>

        {legend ? (
          <IdentitySlotBlock title="Champion" className="flex-1">
            {championSlot}
          </IdentitySlotBlock>
        ) : null}
      </View>

      {runePanel}
    </View>
  );
}
