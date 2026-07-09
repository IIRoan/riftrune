import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import {
  battlefieldCount,
  battlefieldsAtCapacity,
  BATTLEFIELD_MAX,
  battlefieldSlotsRemaining,
} from '@/lib/deck-limits';
import type { DeckSectionKey, DeckState } from '@/lib/deck-types';
import { cn } from '@/lib/utils';

export function DeckAddSectionStatus({
  deck,
  section,
}: {
  deck: DeckState;
  section: DeckSectionKey;
}) {
  if (section !== 'battlefields') return null;

  const count = battlefieldCount(deck);
  const atCapacity = battlefieldsAtCapacity(deck);
  const remaining = battlefieldSlotsRemaining(deck);

  return (
    <View
      className={cn(
        'flex-row items-center gap-2.5 rounded-xl border px-3 py-2.5',
        atCapacity
          ? 'border-success/25 bg-success/5'
          : 'border-archive-soft-line bg-card-panel'
      )}
    >
      <ThemedIonicon
        name={atCapacity ? 'checkmark-circle' : 'grid-outline'}
        size={18}
        color={atCapacity ? 'primary' : 'muted-foreground'}
      />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-[13px] font-medium text-foreground">
          {atCapacity
            ? 'All battlefield slots filled'
            : `${count}/${BATTLEFIELD_MAX} battlefields in deck`}
        </Text>
        <Text className="text-[12px] text-muted-foreground">
          {atCapacity
            ? 'Remove one on your deck to swap in another.'
            : `${remaining} open slot${remaining === 1 ? '' : 's'} · each name is unique`}
        </Text>
      </View>
      <Text
        className={cn(
          'font-mono text-sm font-bold tabular-nums',
          atCapacity ? 'text-success' : 'text-foreground'
        )}
      >
        {count}/{BATTLEFIELD_MAX}
      </Text>
    </View>
  );
}
