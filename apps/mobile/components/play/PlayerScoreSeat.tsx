/**
 * THESIS: The seat half is the control — refuse floating ± discs and bordered chips.
 * OWN-WORLD: Soft typographic etch marks + bare legend identity inside tetra-ui tokens.
 * STORY: Tap left to lose a point, right to gain; legend is quiet identity, not chrome.
 * FIRST VIEWPORT: Hero VP numeral; etched −/+ in each half; legend name or art without a ring.
 * FORM: Etched halves (chosen direction).
 */
import { TypeIcon } from '@/components/riftbound/CardIcons';
import { CardArtImage } from '@/components/cards/CardArtImage';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/context/ThemeContext';
import { playScoreHintClasses } from '@/lib/legend-catalog';
import {
  getPlayFormat,
  isOneAwayFromVictory,
  seatDisplayName,
  type PlayFormatId,
  type SeatState,
} from '@/lib/score-tracker';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { hapticPress } from '@/utils/haptics';
import { Pressable, View } from 'react-native';

const SEAT_SURFACE = [
  'bg-card',
  'bg-card-panel',
  'bg-background',
  'bg-card',
] as const;

type PlayerScoreSeatProps = {
  seat: SeatState;
  seatIndex: number;
  formatId: PlayFormatId;
  isWinner: boolean;
  compact?: boolean;
  onAdjustPoints: (delta: number) => void;
  onAdjustXp: (delta: number) => void;
  onPressLegend: () => void;
};

function XpStepper({
  label,
  onPress,
}: {
  label: 'plus' | 'minus';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === 'plus' ? 'Increase XP' : 'Decrease XP'}
      onPress={() => {
        void hapticPress();
        onPress();
      }}
      hitSlop={8}
      className="min-w-8 items-center justify-center px-1 py-1 active:opacity-60"
    >
      <Text className="font-mono text-lg font-medium tabular-nums text-muted-foreground">
        {label === 'plus' ? '+' : '−'}
      </Text>
    </Pressable>
  );
}

/** Soft typographic etch in a seat half — no plate, no Phosphor disc. */
function ScoreEtch({
  kind,
  compact,
}: {
  kind: 'plus' | 'minus';
  compact: boolean;
}) {
  const { actualTheme } = useTheme();
  const tone = playScoreHintClasses(actualTheme);
  return (
    <Text
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn(
        'font-mono font-light tabular-nums',
        tone.textClassName,
        compact ? 'text-5xl' : 'text-6xl'
      )}
    >
      {kind === 'plus' ? '+' : '−'}
    </Text>
  );
}

export function PlayerScoreSeat({
  seat,
  seatIndex,
  formatId,
  isWinner,
  compact = false,
  onAdjustPoints,
  onAdjustXp,
  onPressLegend,
}: PlayerScoreSeatProps) {
  const format = getPlayFormat(formatId);
  const oneAway = isOneAwayFromVictory(seat.points, format.victoryScore);
  const surface = SEAT_SURFACE[seatIndex % SEAT_SURFACE.length] ?? 'bg-card';
  const name = seatDisplayName(seat);
  const legendUri = seat.legend?.imageUrl
    ? resolveImageUrl(seat.legend.imageUrl)
    : null;

  const bump = (delta: number) => {
    void hapticPress();
    onAdjustPoints(delta);
  };

  return (
    <View
      className={cn(
        'relative min-h-0 min-w-0 flex-1 overflow-hidden',
        surface,
        isWinner && 'bg-primary/15'
      )}
    >
      {legendUri && seat.legend ? (
        <View pointerEvents="none" className="absolute inset-0">
          <CardArtImage
            uri={legendUri}
            recyclingKey={`play-bg-${seat.legend.variantNumber}`}
            className="h-full w-full"
            contentFit="cover"
            contentPosition="top"
            transition={0}
            priority="normal"
          />
          <View className="absolute inset-0 bg-background/72" />
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease points for ${name}`}
        onPress={() => bump(-1)}
        className="absolute bottom-0 left-0 top-0 z-0 w-1/2 active:bg-foreground/[0.06]"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase points for ${name}`}
        onPress={() => bump(1)}
        className="absolute bottom-0 right-0 top-0 z-0 w-1/2 active:bg-foreground/[0.06]"
      />

      {isWinner ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-2 z-20 border-2 border-primary"
        />
      ) : null}

      {!seat.legend ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Set legend"
          onPress={() => {
            void hapticPress();
            onPressLegend();
          }}
          hitSlop={8}
          className="absolute right-2 top-2 z-30 size-12 items-center justify-center active:opacity-70"
        >
          <TypeIcon type="Legend" size={24} tone="default" />
        </Pressable>
      ) : null}

      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 top-0 z-[5] w-1/2 items-start justify-center pl-4"
      >
        <ScoreEtch kind="minus" compact={compact} />
      </View>
      <View
        pointerEvents="none"
        className="absolute bottom-0 right-0 top-0 z-[5] w-1/2 items-end justify-center pr-4"
      >
        <ScoreEtch kind="plus" compact={compact} />
      </View>

      <View
        pointerEvents="box-none"
        className={cn(
          'z-10 h-full w-full items-center justify-center gap-3 px-5',
          compact ? 'py-3' : 'py-5'
        )}
      >
        <View
          pointerEvents="box-none"
          className="flex-row flex-wrap items-center justify-center gap-x-3 gap-y-2"
        >
          {seat.legend ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Change legend, currently ${name}`}
              onPress={() => {
                void hapticPress();
                onPressLegend();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              className="min-h-11 items-center justify-center px-3 py-2.5 active:opacity-70"
            >
              <Text
                className="text-base font-semibold text-foreground"
                numberOfLines={1}
              >
                {name}
              </Text>
            </Pressable>
          ) : null}
          {seat.team ? (
            <Text
              pointerEvents="none"
              className="font-mono text-[11px] font-medium text-muted-foreground"
            >
              Team {seat.team.toUpperCase()}
            </Text>
          ) : null}
          {format.trackMatchWins ? (
            <Text
              pointerEvents="none"
              accessibilityLabel={`${seat.matchWins} match wins`}
              className="font-mono text-[11px] font-medium text-muted-foreground"
            >
              Games {seat.matchWins}
            </Text>
          ) : null}
        </View>

        {oneAway && !isWinner ? (
          <Text
            pointerEvents="none"
            className="text-[11px] font-semibold uppercase tracking-wide text-primary"
          >
            Final point
          </Text>
        ) : null}

        {isWinner ? (
          <Text pointerEvents="none" className="text-sm font-semibold text-primary">
            Victory
          </Text>
        ) : null}

        <Text
          pointerEvents="none"
          accessibilityLabel={`${seat.points} victory points`}
          className={cn(
            'text-center font-mono font-bold tabular-nums text-foreground',
            compact ? 'text-6xl' : 'text-7xl'
          )}
        >
          {seat.points}
        </Text>

        <View className="flex-row items-center gap-1">
          <Text
            pointerEvents="none"
            className="pr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            XP
          </Text>
          <XpStepper label="minus" onPress={() => onAdjustXp(-1)} />
          <Text
            pointerEvents="none"
            accessibilityLabel={`${seat.xp} XP`}
            className="min-w-7 text-center font-mono text-base font-semibold tabular-nums text-foreground"
          >
            {seat.xp}
          </Text>
          <XpStepper label="plus" onPress={() => onAdjustXp(1)} />
        </View>
      </View>
    </View>
  );
}
