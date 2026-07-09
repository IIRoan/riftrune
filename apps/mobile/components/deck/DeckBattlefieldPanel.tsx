import { View } from 'react-native';
import { DeckCardSlot, resolveSlotImage } from '@/components/deck/DeckCardSlot';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { buildBattlefieldSlots } from '@/lib/deck-builder';
import { getSectionCount } from '@/lib/deck-card';
import { BATTLEFIELD_MAX, battlefieldsAtCapacity } from '@/lib/deck-limits';
import type { DeckState } from '@/lib/deck-types';
import { ownedCountForCardName } from '@/lib/deck-validation';
import { cn } from '@/lib/utils';

interface DeckBattlefieldPanelProps {
  deck: DeckState;
  readOnly?: boolean;
  tileWidth: number;
  gap: number;
  imageByVariant: ReadonlyMap<string, string>;
  collectionByName: ReadonlyMap<string, number>;
  onAdd: () => void;
  onRemove: (name: string) => void;
}

function BattlefieldProgress({ count }: { count: number }) {
  const complete = count === BATTLEFIELD_MAX;

  return (
    <View className="flex-row gap-1.5">
      {Array.from({ length: BATTLEFIELD_MAX }, (_, index) => {
        const filled = index < count;
        return (
          <View
            key={`bf-slot-${index}`}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              filled ? (complete ? 'bg-success' : 'bg-primary') : 'bg-border'
            )}
          />
        );
      })}
    </View>
  );
}

export function DeckBattlefieldPanel({
  deck,
  readOnly = false,
  tileWidth,
  gap,
  imageByVariant,
  collectionByName,
  onAdd,
  onRemove,
}: DeckBattlefieldPanelProps) {
  const slots = buildBattlefieldSlots(deck.battlefields);
  const count = getSectionCount(deck, 'battlefields');
  const atCapacity = battlefieldsAtCapacity(deck);
  const complete = count === BATTLEFIELD_MAX;

  return (
    <View className="gap-3">
      <View className="gap-2">
        <View className="flex-row items-end justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-semibold text-foreground">Battlefields</Text>
            <Text className="mt-0.5 text-[12px] text-muted-foreground">
              {complete
                ? 'All battlefield slots filled'
                : `Add ${BATTLEFIELD_MAX - count} unique battlefield${BATTLEFIELD_MAX - count === 1 ? '' : 's'}`}
            </Text>
          </View>
          <Text
            className={cn(
              'font-mono text-sm font-bold tabular-nums',
              complete ? 'text-success' : count > 0 ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {count}/{BATTLEFIELD_MAX}
          </Text>
        </View>
        <BattlefieldProgress count={count} />
      </View>

      <View className="flex-row" style={{ gap }}>
        {slots.map((slot, index) => {
          if (!slot) {
            const canAdd = !atCapacity;
            return (
              <DeckCardSlot
                key={`bf-empty-${index}`}
                variant="empty"
                tileWidth={tileWidth}
                label={canAdd ? `Field ${index + 1}` : 'Full'}
                onAdd={!readOnly && canAdd ? onAdd : undefined}
              />
            );
          }

          const owned = ownedCountForCardName(slot.card.name, collectionByName);
          return (
            <DeckCardSlot
              key={slot.card.name}
              variant="card"
              tileWidth={tileWidth}
              card={slot.card}
              entry={slot}
              imageUri={resolveSlotImage(slot.card, imageByVariant)}
              owned={owned}
              single
              onRemove={readOnly ? undefined : () => onRemove(slot.card.name)}
            />
          );
        })}
      </View>

      {atCapacity ? (
        <View className="flex-row items-center gap-2 rounded-lg border border-archive-soft-line bg-card-panel px-3 py-2">
          <ThemedIonicon name="information-circle-outline" size={16} color="muted-foreground" />
          <Text className="flex-1 text-[12px] text-muted-foreground">
            Remove a battlefield to swap in a different one.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** @deprecated Use DeckBattlefieldPanel */
export const DeckBattlefieldRow = DeckBattlefieldPanel;
