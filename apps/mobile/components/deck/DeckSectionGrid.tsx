import { View } from 'react-native';
import { DeckCardSlot, resolveSlotImage } from '@/components/deck/DeckCardSlot';
import { Text } from '@/components/ui/text';
import {
  buildDeckGridRows,
} from '@/lib/deck-builder';
import { getSectionCount } from '@/lib/deck-card';
import type { DeckEntry, DeckSectionKey, DeckState } from '@/lib/deck-types';
import { ownedCountForCardName } from '@/lib/deck-validation';
import { cn } from '@/lib/utils';

interface DeckSectionGridProps {
  deck: DeckState;
  section: Exclude<DeckSectionKey, 'legend' | 'champion' | 'runes'>;
  readOnly?: boolean;
  title: string;
  subtitle: string;
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
        return (
          <DeckCardSlot
            key={entry.card.name}
            variant="card"
            tileWidth={tileWidth}
            card={entry.card}
            entry={entry}
            imageUri={resolveSlotImage(entry.card, imageByVariant)}
            owned={owned}
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
  subtitle,
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

  return (
    <View className="gap-3">
      <View className="flex-row items-end justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-foreground">{title}</Text>
          <Text className="mt-0.5 font-mono text-[11px] text-muted-foreground">{subtitle}</Text>
        </View>
      </View>

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

export { DeckBattlefieldPanel, DeckBattlefieldRow } from '@/components/deck/DeckBattlefieldPanel';

export function deckSectionSubtitle(deck: DeckState, section: 'mainDeck' | 'sideboard'): string {
  const count = getSectionCount(deck, section);
  if (section === 'mainDeck') {
    const withChampion = count + (deck.champion ? 1 : 0);
    return `Main ${withChampion}/40`;
  }
  return `Side ${count}/8`;
}
