import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { domainIconFor } from '@/constants/gameAssets';
import { countRunesForDomain, getLegendRuneDomains, totalRuneCount } from '@/lib/deck-builder';
import type { DeckCard, DeckState } from '@/lib/deck-types';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface DeckRunePanelProps {
  deck: DeckState;
  readOnly?: boolean;
  runeCardsByDomain: ReadonlyMap<string, DeckCard>;
  onAdjust: (domain: string, delta: number) => void;
  compact?: boolean;
}

function RuneDomainRow({
  domain,
  count,
  targetTotal: _targetTotal,
  readOnly,
  onAdjust,
}: {
  domain: string;
  count: number;
  targetTotal: number;
  readOnly?: boolean;
  onAdjust: (delta: number) => void;
}) {
  const icon = domainIconFor(domain);

  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-archive-soft-line bg-card-panel px-3 py-2.5">
      {icon ? (
        <Image source={icon} style={{ width: 28, height: 28 }} contentFit="contain" />
      ) : (
        <View className="size-7 items-center justify-center rounded-full bg-background">
          <ThemedIonicon name="ellipse" size={12} color="muted-foreground" />
        </View>
      )}

      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-foreground">{domain}</Text>
        <Text className="font-mono text-[11px] text-muted-foreground">
          {count} rune{count === 1 ? '' : 's'}
        </Text>
      </View>

      <View className="flex-row items-center overflow-hidden rounded-lg border border-border bg-background">
        {readOnly ? (
          <Text className="min-w-[2rem] px-2 text-center font-mono text-sm font-bold tabular-nums text-foreground">
            {count}
          </Text>
        ) : (
          <>
            <Pressable
              accessibilityLabel={`Remove ${domain} rune`}
              className="size-8 items-center justify-center active:bg-card-panel"
              onPress={() => {
                hapticPress();
                onAdjust(-1);
              }}
            >
              <ThemedIonicon name="remove" size={16} color="foreground" />
            </Pressable>
            <Text className="min-w-[1.5rem] text-center font-mono text-sm font-bold tabular-nums text-foreground">
              {count}
            </Text>
            <Pressable
              accessibilityLabel={`Add ${domain} rune`}
              className="size-8 items-center justify-center active:bg-card-panel"
              onPress={() => {
                hapticPress();
                onAdjust(1);
              }}
            >
              <ThemedIonicon name="add" size={16} color="foreground" />
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
  compact,
}: DeckRunePanelProps) {
  if (!deck.legend) return null;

  const [firstDomain, secondDomain] = getLegendRuneDomains(deck.legend);
  const total = totalRuneCount(deck.runes);
  const target = 12;
  const complete = total === target;

  return (
    <View className={cn('gap-3', compact ? 'flex-1' : 'flex-1 justify-center')}>
      <View className="flex-row items-end justify-between gap-2">
        <View>
          <Text className="text-sm font-semibold text-foreground">Rune deck</Text>
          <Text className="mt-0.5 text-[12px] text-muted-foreground">
            Split {target} runes across your Legend domains
          </Text>
        </View>
        <Text
          className={cn(
            'font-mono text-sm font-bold tabular-nums',
            complete ? 'text-success' : 'text-warning'
          )}
        >
          {total}/{target}
        </Text>
      </View>

      <View className="gap-2">
        <RuneDomainRow
          domain={firstDomain}
          count={countRunesForDomain(deck.runes, firstDomain)}
          targetTotal={target}
          readOnly={readOnly}
          onAdjust={(delta) => onAdjust(firstDomain, delta)}
        />
        {secondDomain !== firstDomain ? (
          <RuneDomainRow
            domain={secondDomain}
            count={countRunesForDomain(deck.runes, secondDomain)}
            targetTotal={target}
            readOnly={readOnly}
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
