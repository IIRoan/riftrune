import { View } from 'react-native';
import { DeckCardSlot, resolveSlotImage } from '@/components/deck/DeckCardSlot';
import { DeckSectionHeader } from '@/components/deck/DeckSectionHeader';
import { buildDeckGridRows } from '@/lib/deck-builder';
import { getSectionCount } from '@/lib/deck-card';
import { deckSectionProgress } from '@/lib/deck-display';
import type { DeckEntry, DeckSectionKey, DeckState } from '@/lib/deck-types';
import { isCardTournamentIllegal } from '@/lib/card-legality';
import { ownedCountForCardName } from '@/lib/deck-validation';
import { cn } from '@/lib/utils';

interface DeckSectionGridProps {
  deck: DeckState;
  section: Exclude<DeckSectionKey, 'legend' | 'champion' | 'runes'>;
  readOnly?: boolean;
  title: string;
  tileWidth: number;
  gap: number;
  gridColumns: number;
  imageByVariant: ReadonlyMap<string, string>;
  collectionByName: ReadonlyMap<string, number>;
  onAdd: () => void;
  onMinus: (name: string) => void;
  onPlus: (name: string) => void;
  onRemove: (name: string) => void;
}

function DeckGridRow({
  row,
  tileWidth,
  gap,
  imageByVariant,
  collectionByName,
  readOnly,
  deck,
  onAdd,
  onMinus,
  onPlus,
  onRemove,
}: {
  row: ReturnType<typeof buildDeckGridRows>[number];
  tileWidth: number;
  gap: number;
  imageByVariant: ReadonlyMap<string, string>;
  collectionByName: ReadonlyMap<string, number>;
  readOnly?: boolean;
  deck: DeckState;
  onAdd: () => void;
  onMinus: (name: string) => void;
  onPlus: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  return (
    <View className="flex-row" style={{ gap, marginBottom: gap }}>
      {row.map((cell, index) => {
        if (cell.kind === 'add') {
          return <DeckCardSlot key={`add-${index}`} variant="add" tileWidth={tileWidth} onAdd={onAdd} />;
        }

        if (cell.kind !== 'card') {
          return null;
        }

        const { entry } = cell;
        const owned = ownedCountForCardName(entry.card.name, collectionByName);
        const illegal = isCardTournamentIllegal(entry.card, deck);
        return (
          <DeckCardSlot
            key={entry.card.name}
            variant="card"
            tileWidth={tileWidth}
            card={entry.card}
            entry={entry}
            imageUri={resolveSlotImage(entry.card, imageByVariant)}
            owned={owned}
            illegal={illegal}
            onMinus={() => onMinus(entry.card.name)}
            onPlus={() => onPlus(entry.card.name)}
            onRemove={readOnly ? undefined : () => onRemove(entry.card.name)}
          />
        );
      })}
    </View>
  );
}

export function DeckSectionGrid({
  deck,
  section,
  readOnly = false,
  title,
  tileWidth,
  gap,
  gridColumns,
  imageByVariant,
  collectionByName,
  onAdd,
  onMinus,
  onPlus,
  onRemove,
}: DeckSectionGridProps) {
  const entries = [...deck[section].values()].sort((a, b) => {
    if (a.card.energy !== b.card.energy) return a.card.energy - b.card.energy;
    return a.card.name.localeCompare(b.card.name);
  });

  const rows = buildDeckGridRows(entries, {
    columns: gridColumns,
    includeAdd: !readOnly,
  });

  const progress = deckSectionProgress(deck, section);

  return (
    <View className="gap-3">
      <DeckSectionHeader
        title={title}
        current={progress.current}
        target={progress.target}
        hint={progress.hint}
        readOnly={readOnly}
        onAdd={readOnly ? undefined : onAdd}
      />

      <View>
        {rows.map((row, index) => (
          <DeckGridRow
            key={`row-${index}`}
            row={row}
            tileWidth={tileWidth}
            gap={gap}
            imageByVariant={imageByVariant}
            collectionByName={collectionByName}
            readOnly={readOnly}
            deck={deck}
            onAdd={onAdd}
            onMinus={onMinus}
            onPlus={onPlus}
            onRemove={onRemove}
          />
        ))}
      </View>
    </View>
  );
}

export { DeckBattlefieldPanel } from '@/components/deck/DeckBattlefieldPanel';

export function deckSectionSubtitle(deck: DeckState, section: 'mainDeck' | 'sideboard'): string {
  const count = getSectionCount(deck, section);
  if (section === 'mainDeck') {
    const withChampion = count + (deck.champion ? 1 : 0);
    return `Main ${withChampion}/40`;
  }
  return `Side ${count}/8`;
}
