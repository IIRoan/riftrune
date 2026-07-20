import type { ReactNode } from 'react';
import { View } from 'react-native';
import { DeckCardSlot, resolveSlotImage } from '@/components/deck/DeckCardSlot';
import { DeckRunePanel } from '@/components/deck/DeckRunePanel';
import { Text } from '@/components/ui/text';
import { isCardTournamentIllegal } from '@/lib/card-legality';
import type { DeckCard, DeckState } from '@/lib/deck-types';
import { ownedCountForCardName } from '@/lib/deck-validation';
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
}

/** Fixed header so legend/champion columns share the same card baseline. */
function IdentitySlotBlock({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('min-w-0 flex-1 gap-2', className)}>
      <View className="h-10 justify-start overflow-hidden">
        <Text className="text-[13px] font-semibold leading-4 text-foreground" numberOfLines={1}>
          {title}
        </Text>
        <Text
          className="mt-0.5 text-[11px] leading-4 text-muted-foreground"
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
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
}: DeckIdentityHeaderProps) {
  const legend = deck.legend;
  const tileWidth = legendTileWidth;

  const legendSlot = legend ? (
    <DeckCardSlot
      variant="card"
      tileWidth={tileWidth}
      card={legend}
      imageUri={resolveSlotImage(legend, imageByVariant)}
      owned={ownedCountForCardName(legend.name, collectionByName)}
      illegal={isCardTournamentIllegal(legend, deck)}
      single
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

  return (
    <View className="gap-3">
      <View className="flex-row items-stretch gap-2">
        <IdentitySlotBlock title="Legend" subtitle="Domain identity & runes">
          {legendSlot}
        </IdentitySlotBlock>

        {legend ? (
          <IdentitySlotBlock title="Champion" subtitle="Matching champion tag">
            {championSlot}
          </IdentitySlotBlock>
        ) : null}
      </View>

      {legend ? (
        <DeckRunePanel
          deck={deck}
          readOnly={readOnly}
          runeCardsByDomain={runeCardsByDomain}
          onAdjust={onAdjustRune}
          dense
        />
      ) : null}
    </View>
  );
}
