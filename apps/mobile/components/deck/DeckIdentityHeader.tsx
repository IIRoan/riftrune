import type { ReactNode } from 'react';
import { View } from 'react-native';
import { DeckCardSlot, resolveSlotImage } from '@/components/deck/DeckCardSlot';
import { DeckRunePanel } from '@/components/deck/DeckRunePanel';
import { Text } from '@/components/ui/text';
import { useMobileLayout } from '@/hooks/useBreakpoint';
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

function IdentitySlotBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-2.5">
      <View>
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</Text>
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
  const isMobile = useMobileLayout();
  const legend = deck.legend;
  const tileWidth = isMobile ? legendTileWidth : Math.min(legendTileWidth, 140);

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
    <View className="gap-4">
      <View className={cn('gap-4', !isMobile && 'flex-row items-start')}>
        <View className={cn('gap-4', !isMobile && 'shrink-0')}>
          <IdentitySlotBlock
            title="Champion Legend"
            subtitle="Defines domain identity and rune colors"
          >
            {legendSlot}
          </IdentitySlotBlock>

          {legend ? (
            <IdentitySlotBlock
              title="Chosen Champion"
              subtitle="Must share a champion tag with your Legend"
            >
              {championSlot}
            </IdentitySlotBlock>
          ) : null}
        </View>

        {legend ? (
          <View className={cn('min-w-0', !isMobile ? 'flex-1' : undefined)}>
            <DeckRunePanel
              deck={deck}
              readOnly={readOnly}
              runeCardsByDomain={runeCardsByDomain}
              onAdjust={onAdjustRune}
              compact={isMobile}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
