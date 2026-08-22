import { Pressable, View } from 'react-native';
import { LightningIcon, ThemedIcon } from '@/components/icons';
import { DeckStatsHistogram } from '@/components/deck/DeckStatsHistogram';
import { DomainIcon, TypeIcon } from '@/components/riftbound/CardIcons';
import { Text } from '@/components/ui/text';
import {
  formatDeckStatAverage,
  type DeckStatMixItem,
  type DeckStats,
} from '@/lib/deck-stats';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

interface DeckStatsCompactProps {
  stats: DeckStats;
  statsOpen?: boolean;
  readOnly?: boolean;
  onToggleStats?: () => void;
}

function MixChip({ item }: { item: DeckStatMixItem }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {item.kind === 'domain' ? <DomainIcon name={item.label} size={14} /> : null}
      {item.kind === 'type' ? (
        <TypeIcon type={item.label} size={14} tone="foreground" />
      ) : null}
      <Text className="font-mono text-[12px] font-medium tabular-nums text-foreground">
        {item.count}
      </Text>
    </View>
  );
}

export function DeckStatsCompact({
  stats,
  statsOpen = false,
  readOnly = false,
  onToggleStats,
}: DeckStatsCompactProps) {
  const interactive = onToggleStats != null;
  const empty = stats.cardCount === 0;
  const showGlance = !statsOpen;
  const domainLabel = stats.domains
    .map((item) => `${item.label} ${item.count}`)
    .join(', ');
  const typeLabel = stats.types.map((item) => `${item.label} ${item.count}`).join(', ');
  const cardsLabel = readOnly ? 'Deck' : 'Cards';
  const actionLabel = statsOpen ? cardsLabel : 'Stats';

  return (
    <Pressable
      accessibilityRole={interactive ? 'button' : 'text'}
      accessibilityState={interactive ? { selected: statsOpen } : undefined}
      accessibilityLabel={
        statsOpen
          ? readOnly
            ? 'Show deck showcase'
            : 'Show card catalog'
          : `Show deck stats, average energy ${formatDeckStatAverage(stats.avgEnergy)}, average power ${formatDeckStatAverage(stats.avgPower)}${domainLabel ? `, ${domainLabel}` : ''}${typeLabel ? `, ${typeLabel}` : ''}`
      }
      disabled={!interactive}
      onPress={() => {
        if (!interactive) return;
        hapticPress();
        onToggleStats();
      }}
      className={cn(interactive && 'active:opacity-90')}
    >
      <View
        className={cn(
          'flex-row items-center justify-between gap-2',
          showGlance && 'mb-3'
        )}
      >
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-x-4 gap-y-1">
          <View className="flex-row items-center gap-1.5">
            <ThemedIcon icon={LightningIcon} size={13} color="muted-foreground" />
            <Text className="font-mono text-[13px] font-medium tabular-nums text-foreground">
              {formatDeckStatAverage(stats.avgEnergy)}
            </Text>
          </View>
          <Text className="font-mono text-[13px] font-medium tabular-nums text-muted-foreground">
            P {formatDeckStatAverage(stats.avgPower)}
          </Text>
        </View>
        {interactive ? (
          <Text
            className={cn(
              'font-mono text-[11px] font-medium uppercase tracking-[-0.24px]',
              statsOpen ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {actionLabel}
          </Text>
        ) : null}
      </View>

      {showGlance && empty ? (
        <Text className="mb-3 text-[12px] leading-4 text-muted-foreground">
          Add main-deck cards to plot energy, domains, and types.
        </Text>
      ) : null}

      {showGlance && !empty && (stats.domains.length > 0 || stats.types.length > 0) ? (
        <View className="mb-3 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          {stats.domains.map((item) => (
            <MixChip key={item.key} item={item} />
          ))}
          {stats.types.map((item) => (
            <MixChip key={item.key} item={item} />
          ))}
        </View>
      ) : null}

      {showGlance ? (
        <DeckStatsHistogram buckets={stats.energy} compact accessibilityUnit="Energy" />
      ) : null}
    </Pressable>
  );
}
