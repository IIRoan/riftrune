import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { totalRuneCount } from '@/lib/deck-builder';
import { getSectionCount } from '@/lib/deck-card';
import { deckSectionProgress } from '@/lib/deck-display';
import type { DeckSectionKey, DeckState } from '@/lib/deck-types';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

type BuilderSectionKey = 'mainDeck' | 'runes' | 'battlefields' | 'sideboard';

const SECTIONS: {
  key: BuilderSectionKey;
  label: string;
  addSection: DeckSectionKey;
  primary?: boolean;
}[] = [
  { key: 'mainDeck', label: 'Main', addSection: 'mainDeck', primary: true },
  { key: 'runes', label: 'Runes', addSection: 'runes' },
  { key: 'battlefields', label: 'Fields', addSection: 'battlefields' },
  { key: 'sideboard', label: 'Side', addSection: 'sideboard' },
];

function sectionCounts(
  deck: DeckState,
  key: BuilderSectionKey
): { current: number; target: number } {
  if (key === 'runes') {
    return { current: totalRuneCount(deck.runes), target: 12 };
  }
  return deckSectionProgress(deck, key);
}

interface DeckBuilderStatusStripProps {
  deck: DeckState;
  readOnly?: boolean;
  onSectionPress?: (section: DeckSectionKey) => void;
  /** e.g. "2/5 owned" */
  ownershipLabel?: string;
}

function MeterTrack({
  ratio,
  complete,
  tall = false,
}: {
  ratio: number;
  complete: boolean;
  tall?: boolean;
}) {
  return (
    <View
      className={cn(
        'overflow-hidden rounded-full bg-border/70',
        tall ? 'h-1.5' : 'h-1'
      )}
    >
      <View
        className={cn('h-full rounded-full', complete ? 'bg-success' : 'bg-primary')}
        style={{ width: `${Math.max(ratio * 100, ratio > 0 ? 6 : 0)}%` }}
      />
    </View>
  );
}

/**
 * Deck completion instrument for the right rail — one stacked readout,
 * not a grid of mini-cards.
 */
export function DeckBuilderStatusStrip({
  deck,
  readOnly = false,
  onSectionPress,
  ownershipLabel,
}: DeckBuilderStatusStripProps) {
  const main = sectionCounts(deck, 'mainDeck');
  const mainComplete = main.current >= main.target;
  const mainRatio = main.target > 0 ? Math.min(1, main.current / main.target) : 0;
  const mainInteractive = !readOnly && Boolean(onSectionPress) && !mainComplete;

  const secondary = SECTIONS.filter((section) => !section.primary);

  return (
    <View className="gap-3">
      <Pressable
        accessibilityRole={mainInteractive ? 'button' : 'text'}
        accessibilityLabel={`Main ${main.current} of ${main.target}`}
        disabled={!mainInteractive}
        onPress={() => {
          if (!mainInteractive) return;
          hapticPress();
          onSectionPress?.('mainDeck');
        }}
        className={cn(mainInteractive && 'active:opacity-90')}
      >
        <View className="mb-1.5 flex-row items-end justify-between gap-2">
          <View className="min-w-0 flex-1">
            <Text className="text-[12px] font-medium text-muted-foreground">Main deck</Text>
            <View className="mt-0.5 flex-row items-baseline gap-1">
              <Text
                className={cn(
                  'font-mono text-2xl font-bold tabular-nums leading-none',
                  mainComplete ? 'text-success' : 'text-foreground'
                )}
              >
                {main.current}
              </Text>
              <Text className="font-mono text-[13px] font-semibold tabular-nums text-muted-foreground">
                / {main.target}
              </Text>
            </View>
          </View>
          {mainComplete ? (
            <ThemedIonicon name="checkmark-circle" size={18} color="primary" />
          ) : ownershipLabel ? (
            <Text className="pb-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
              {ownershipLabel}
            </Text>
          ) : null}
        </View>
        <MeterTrack ratio={mainRatio} complete={mainComplete} tall />
      </Pressable>

      <View className="gap-0">
        {secondary.map(({ key, label, addSection }, index) => {
          const { current, target } = sectionCounts(deck, key);
          const complete = current >= target;
          const ratio = target > 0 ? Math.min(1, current / target) : 0;
          const interactive = !readOnly && Boolean(onSectionPress) && !complete;

          return (
            <Pressable
              key={key}
              accessibilityRole={interactive ? 'button' : 'text'}
              accessibilityLabel={`${label} ${current} of ${target}`}
              disabled={!interactive}
              onPress={() => {
                if (!interactive) return;
                hapticPress();
                onSectionPress?.(addSection);
              }}
              className={cn(
                'py-2 active:opacity-90',
                index < secondary.length - 1 && 'border-b border-border/50',
                !interactive && 'opacity-100'
              )}
            >
              <View className="mb-1.5 flex-row items-center justify-between gap-2">
                <Text className="text-[12px] font-medium text-muted-foreground">{label}</Text>
                <View className="flex-row items-center gap-1.5">
                  <Text
                    className={cn(
                      'font-mono text-[12px] font-bold tabular-nums',
                      complete ? 'text-success' : 'text-foreground'
                    )}
                  >
                    {current}/{target}
                  </Text>
                  {complete ? (
                    <ThemedIonicon name="checkmark" size={12} color="primary" />
                  ) : null}
                </View>
              </View>
              <MeterTrack ratio={ratio} complete={complete} />
            </Pressable>
          );
        })}
      </View>

      {ownershipLabel && mainComplete ? (
        <Text className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {ownershipLabel}
        </Text>
      ) : null}
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
