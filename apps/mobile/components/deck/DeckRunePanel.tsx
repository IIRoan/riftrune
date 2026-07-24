import { ThemedIcon, CircleIcon, MinusIcon, PlusIcon } from '@/components/icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { domainIconFor } from '@/constants/gameAssets';
import {
  countRunesForDomain,
  getLegendRuneDomains,
  totalRuneCount,
} from '@/lib/deck-builder';
import type { DeckCard, DeckState } from '@/lib/deck-types';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface DeckRunePanelProps {
  deck: DeckState;
  readOnly?: boolean;
  runeCardsByDomain: ReadonlyMap<string, DeckCard>;
  onAdjust: (domain: string, delta: number) => void;
  /** Tighter layout for narrow side drawers. */
  dense?: boolean;
  compact?: boolean;
}

function RuneDomainRow({
  domain,
  count,
  readOnly,
  dense,
  onAdjust,
}: {
  domain: string;
  count: number;
  readOnly?: boolean;
  dense?: boolean;
  onAdjust: (delta: number) => void;
}) {
  const icon = domainIconFor(domain);
  const iconSize = dense ? 22 : 28;

  return (
    <View
      className={cn(
        'min-w-0 flex-row items-center rounded-lg border border-archive-soft-line bg-card-panel',
        dense ? 'gap-2 px-2 py-2' : 'gap-3 px-3 py-3'
      )}
    >
      {icon ? (
        <Image
          source={icon}
          style={{ width: iconSize, height: iconSize }}
          contentFit="contain"
          className="shrink-0"
        />
      ) : (
        <View
          className={cn(
            'shrink-0 items-center justify-center rounded-full bg-background',
            dense ? 'size-5.5' : 'size-7'
          )}
          style={dense ? { width: 22, height: 22 } : undefined}
        >
          <ThemedIcon
            icon={CircleIcon}
            size={dense ? 10 : 12}
            color="muted-foreground"
          />
        </View>
      )}

      <View className="min-w-0 flex-1">
        <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
          {domain}
        </Text>
        {!dense ? (
          <Text className="font-mono text-[11px] text-muted-foreground">
            {count} rune{count === 1 ? '' : 's'}
          </Text>
        ) : null}
      </View>

      <View
        className={cn(
          'shrink-0 flex-row items-center justify-between',
          !readOnly && (dense ? 'min-w-[4.75rem]' : 'min-w-[5.75rem]')
        )}
      >
        {readOnly ? (
          <Text className="px-2 py-1 text-center font-mono text-sm font-semibold tabular-nums text-foreground">
            {count}
          </Text>
        ) : (
          <>
            <Pressable
              accessibilityLabel={`Remove ${domain} rune`}
              className={cn(
                'items-center justify-center rounded-full active:bg-primary/14',
                dense ? 'size-7' : 'size-8'
              )}
              onPress={() => {
                hapticPress();
                onAdjust(-1);
              }}
            >
              <ThemedIcon
                icon={MinusIcon}
                size={dense ? 12 : 14}
                color="archive-accent-text"
              />
            </Pressable>
            <Text className="min-w-5 text-center font-mono text-[13px] font-semibold tabular-nums text-foreground">
              {count}
            </Text>
            <Pressable
              accessibilityLabel={`Add ${domain} rune`}
              className={cn(
                'items-center justify-center rounded-full active:bg-primary/14',
                dense ? 'size-7' : 'size-8'
              )}
              onPress={() => {
                hapticPress();
                onAdjust(1);
              }}
            >
              <ThemedIcon
                icon={PlusIcon}
                size={dense ? 12 : 14}
                color="archive-accent-text"
              />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

export function DeckRunePanel({
  deck,
  readOnly = false,
  runeCardsByDomain,
  onAdjust,
  dense = false,
  compact,
}: DeckRunePanelProps) {
  if (!deck.legend) return null;

  const [firstDomain, secondDomain] = getLegendRuneDomains(deck.legend);
  const total = totalRuneCount(deck.runes);
  const target = 12;
  const complete = total === target;
  const useDense = dense || compact === true;

  return (
    <View className={cn('min-w-0 gap-2', compact ? 'flex-1' : undefined)}>
      <View className="min-w-0 flex-row items-center justify-between gap-2">
        <Text
          className="min-w-0 flex-1 text-[13px] font-semibold text-foreground"
          numberOfLines={1}
        >
          Rune deck
        </Text>
        <Text
          className={cn(
            'shrink-0 font-mono text-[12px] font-bold tabular-nums',
            complete ? 'text-success' : 'text-warning'
          )}
        >
          {total}/{target}
        </Text>
      </View>

      <View className="min-w-0 gap-1.5">
        <RuneDomainRow
          domain={firstDomain}
          count={countRunesForDomain(deck.runes, firstDomain)}
          readOnly={readOnly}
          dense={useDense}
          onAdjust={(delta) => onAdjust(firstDomain, delta)}
        />
        {secondDomain !== firstDomain ? (
          <RuneDomainRow
            domain={secondDomain}
            count={countRunesForDomain(deck.runes, secondDomain)}
            readOnly={readOnly}
            dense={useDense}
            onAdjust={(delta) => onAdjust(secondDomain, delta)}
          />
        ) : null}
      </View>

      {!runeCardsByDomain.size ? (
        <Text className="text-[11px] text-muted-foreground">
          Loading rune cards from catalog…
        </Text>
      ) : null}
    </View>
  );
}
