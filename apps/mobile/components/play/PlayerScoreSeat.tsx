import { MinusIcon, PlusIcon } from '@/components/icons';
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
  const Icon = label === 'plus' ? PlusIcon : MinusIcon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === 'plus' ? 'Increase XP' : 'Decrease XP'}
      onPress={() => {
        void hapticPress();
        onPress();
      }}
      className="size-9 items-center justify-center rounded-full border border-border bg-background/50 active:bg-primary/20"
    >
      <Icon size={18} className="text-foreground" />
    </Pressable>
  );
}

function ScoreHint({
  kind,
  compact,
}: {
  kind: 'plus' | 'minus';
  compact: boolean;
}) {
  const { actualTheme } = useTheme();
  const tone = playScoreHintClasses(actualTheme);
  const Icon = kind === 'plus' ? PlusIcon : MinusIcon;
  const iconSize = compact ? 26 : 32;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn(
        'items-center justify-center rounded-full shadow-sm',
        tone.plateClassName,
        compact ? 'size-12' : 'size-14'
      )}
    >
      <Icon
        size={iconSize}
        color={tone.iconColor}
        className={tone.iconClassName}
        weight="bold"
      />
    </View>
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
        'relative min-h-0 min-w-0 flex-1 overflow-hidden border border-border/60',
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
            contentPosition="center"
            transition={0}
            priority="normal"
          />
          <View className="absolute inset-0 bg-background/70" />
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease points for ${name}`}
        onPress={() => bump(-1)}
        className="absolute bottom-0 left-0 top-0 z-0 w-1/2 active:bg-foreground/5"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase points for ${name}`}
        onPress={() => bump(1)}
        className="absolute bottom-0 right-0 top-0 z-0 w-1/2 active:bg-foreground/5"
      />

      {isWinner ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-1.5 z-20 rounded-xl border-4 border-primary"
        />
      ) : null}

      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 top-0 z-[5] w-1/2 items-center justify-center"
      >
        <ScoreHint kind="minus" compact={compact} />
      </View>
      <View
        pointerEvents="none"
        className="absolute bottom-0 right-0 top-0 z-[5] w-1/2 items-center justify-center"
      >
        <ScoreHint kind="plus" compact={compact} />
      </View>

      <View
        pointerEvents="box-none"
        className={cn(
          'z-10 h-full w-full items-center justify-center gap-3 px-4',
          compact ? 'py-3' : 'py-5'
        )}
      >
        <View
          pointerEvents="box-none"
          className="flex-row flex-wrap items-center justify-center gap-2"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              seat.legend ? `Change legend, currently ${name}` : 'Set legend'
            }
            onPress={() => {
              void hapticPress();
              onPressLegend();
            }}
            className={cn(
              'flex-row items-center gap-1.5 rounded-full border active:opacity-80',
              seat.legend
                ? 'border-border bg-background/55 px-2.5 py-1'
                : 'size-10 items-center justify-center border-primary/50 bg-primary/15'
            )}
          >
            <TypeIcon type="Legend" size={seat.legend ? 14 : 18} tone="foreground" />
            {seat.legend ? (
              <Text className="max-w-[9rem] text-xs font-semibold text-foreground" numberOfLines={1}>
                {name}
              </Text>
            ) : null}
          </Pressable>
          {seat.team ? (
            <View
              pointerEvents="none"
              className="rounded-full border border-border bg-background/55 px-2.5 py-1"
            >
              <Text className="font-mono text-[11px] font-semibold text-muted-foreground">
                Team {seat.team.toUpperCase()}
              </Text>
            </View>
          ) : null}
          {format.trackMatchWins ? (
            <View
              pointerEvents="none"
              className="rounded-full border border-border bg-background/55 px-2.5 py-1"
            >
              <Text
                accessibilityLabel={`${seat.matchWins} match wins`}
                className="font-mono text-[11px] font-semibold text-muted-foreground"
              >
                Games {seat.matchWins}
              </Text>
            </View>
          ) : null}
        </View>

        {oneAway && !isWinner ? (
          <Text
            pointerEvents="none"
            className="font-mono text-[11px] font-semibold uppercase tracking-wide text-primary"
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

        <View className="flex-row items-center gap-2">
          <Text
            pointerEvents="none"
            className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            XP
          </Text>
          <View className="flex-row items-center gap-2 rounded-full border border-border bg-background/55 px-1.5 py-1">
            <XpStepper label="minus" onPress={() => onAdjustXp(-1)} />
            <Text
              pointerEvents="none"
              accessibilityLabel={`${seat.xp} XP`}
              className="min-w-8 text-center font-mono text-base font-semibold tabular-nums text-foreground"
            >
              {seat.xp}
            </Text>
            <XpStepper label="plus" onPress={() => onAdjustXp(1)} />
          </View>
        </View>
      </View>
    </View>
  );
}
