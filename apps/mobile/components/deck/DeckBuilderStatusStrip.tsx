import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { totalRuneCount } from '@/lib/deck-builder';
import { getSectionCount } from '@/lib/deck-card';
import { deckSectionProgress } from '@/lib/deck-display';
import type { DeckSectionKey, DeckState } from '@/lib/deck-types';
import { cn } from '@/lib/utils';

type BuilderSectionKey = 'mainDeck' | 'runes' | 'battlefields' | 'sideboard';

const STRIP_SECTIONS: { key: BuilderSectionKey; label: string; addSection: DeckSectionKey }[] = [
  { key: 'mainDeck', label: 'Main', addSection: 'mainDeck' },
  { key: 'runes', label: 'Runes', addSection: 'runes' },
  { key: 'battlefields', label: 'Fields', addSection: 'battlefields' },
  { key: 'sideboard', label: 'Side', addSection: 'sideboard' },
];

function stripCounts(deck: DeckState, key: BuilderSectionKey): { current: number; target: number } {
  if (key === 'runes') {
    return { current: totalRuneCount(deck.runes), target: 12 };
  }
  return deckSectionProgress(deck, key);
}

interface DeckBuilderStatusStripProps {
  deck: DeckState;
  readOnly?: boolean;
  onSectionPress?: (section: DeckSectionKey) => void;
}

export function DeckBuilderStatusStrip({
  deck,
  readOnly = false,
  onSectionPress,
}: DeckBuilderStatusStripProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {STRIP_SECTIONS.map(({ key, label, addSection }) => {
        const { current, target } = stripCounts(deck, key);
        const complete = current >= target;
        const ratio = target > 0 ? Math.min(1, current / target) : 0;
        const interactive = !readOnly && onSectionPress && !complete;

        return (
          <Pressable
            key={key}
            accessibilityRole={interactive ? 'button' : 'text'}
            accessibilityLabel={`${label} ${current} of ${target}`}
            disabled={!interactive}
            onPress={() => onSectionPress?.(addSection)}
            className={cn(
              'min-w-[4.5rem] flex-1 gap-1.5 rounded-lg border px-3 py-2',
              complete ? 'border-success/30 bg-success/5' : 'border-border bg-card',
              interactive && 'active:opacity-90'
            )}
          >
            <View className="flex-row items-baseline justify-between gap-1">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </Text>
              <Text
                className={cn(
                  'font-mono text-[11px] font-bold tabular-nums',
                  complete ? 'text-success' : 'text-foreground'
                )}
              >
                {current}/{target}
              </Text>
            </View>
            <View className="h-1 overflow-hidden rounded-full bg-border/80">
              <View
                className={cn('h-full rounded-full', complete ? 'bg-success' : 'bg-primary')}
                style={{ width: `${Math.max(ratio * 100, current > 0 ? 8 : 0)}%` }}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** One-line deck stats for headers (add flow, etc.). */
export function deckBuilderHeadlineStats(deck: DeckState): string {
  const main = deckSectionProgress(deck, 'mainDeck');
  const runes = totalRuneCount(deck.runes);
  const fields = getSectionCount(deck, 'battlefields');
  const side = getSectionCount(deck, 'sideboard');
  return `Main ${main.current}/${main.target} · Runes ${runes}/12 · Fields ${fields}/3 · Side ${side}/8`;
}
