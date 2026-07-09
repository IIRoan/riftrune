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
  championTileWidth: number;
  imageByVariant: ReadonlyMap<string, string>;
  collectionByName: ReadonlyMap<string, number>;
  runeCardsByDomain: ReadonlyMap<string, DeckCard>;
  onChangeLegend: () => void;
  onAddChampion: () => void;
  onRemoveChampion: () => void;
  onAdjustRune: (domain: string, delta: number) => void;
}

export function DeckIdentityHeader({
  deck,
  readOnly = false,
  legendTileWidth,
  championTileWidth,
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

  return (
    <View className="gap-4">
      <View className={cn('gap-4', !isMobile && 'flex-row items-start')}>
        <View className="gap-3 self-start">
          <View>
            <Text className="text-sm font-semibold text-foreground">Champion Legend</Text>
            <Text className="mt-0.5 text-[12px] text-muted-foreground">
              Defines domain identity and rune colors
            </Text>
          </View>

          {legend ? (
            <DeckCardSlot
              variant="card"
              tileWidth={legendTileWidth}
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
              tileWidth={legendTileWidth}
              label="Choose Legend"
              onAdd={readOnly ? undefined : onChangeLegend}
            />
          )}
        </View>

        <View className={cn('gap-3', !isMobile ? 'min-w-0 flex-1' : undefined)}>
          {legend ? (
            <DeckRunePanel
              deck={deck}
              readOnly={readOnly}
              runeCardsByDomain={runeCardsByDomain}
              onAdjust={onAdjustRune}
              compact={isMobile}
            />
          ) : null}
        </View>
      </View>

      {legend ? (
        <View className="gap-3">
          <View>
            <Text className="text-sm font-semibold text-foreground">Chosen Champion</Text>
            <Text className="mt-0.5 text-[12px] text-muted-foreground">
              Must share a champion tag with your Legend
            </Text>
          </View>

          {deck.champion ? (
            <View className="self-start">
              <DeckCardSlot
                variant="card"
                tileWidth={championTileWidth}
                card={deck.champion}
                imageUri={resolveSlotImage(deck.champion, imageByVariant)}
                owned={ownedCountForCardName(deck.champion.name, collectionByName)}
                illegal={isCardTournamentIllegal(deck.champion, deck)}
                single
                onAdd={readOnly ? undefined : onAddChampion}
                onRemove={readOnly ? undefined : onRemoveChampion}
              />
            </View>
          ) : (
            <View className="self-start">
              <DeckCardSlot
                variant="identity"
                tileWidth={championTileWidth}
                label="Add Champion"
                onAdd={readOnly ? undefined : onAddChampion}
              />
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
