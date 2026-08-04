import { PlayerScoreSeat } from '@/components/play/PlayerScoreSeat';
import type { PlayFormatId, ScoreTrackerState, SeatState } from '@/lib/score-tracker';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type PlayScoreboardProps = {
  state: ScoreTrackerState;
  rail: ReactNode;
  onAdjustPoints: (seatId: string, delta: number) => void;
  onAdjustXp: (seatId: string, delta: number) => void;
  onPressLegend: (seatId: string) => void;
};

function SeatFrame({
  seat,
  seatIndex,
  formatId,
  isWinner,
  rotation = 0,
  compact,
  onAdjustPoints,
  onAdjustXp,
  onPressLegend,
  className,
}: {
  seat: SeatState;
  seatIndex: number;
  formatId: PlayFormatId;
  isWinner: boolean;
  rotation?: 0 | 180;
  compact?: boolean;
  onAdjustPoints: (delta: number) => void;
  onAdjustXp: (delta: number) => void;
  onPressLegend: () => void;
  className?: string;
}) {
  return (
    <View
      className={className}
      style={rotation === 180 ? { transform: [{ rotate: '180deg' }] } : undefined}
    >
      <PlayerScoreSeat
        seat={seat}
        seatIndex={seatIndex}
        formatId={formatId}
        isWinner={isWinner}
        compact={compact}
        onAdjustPoints={onAdjustPoints}
        onAdjustXp={onAdjustXp}
        onPressLegend={onPressLegend}
      />
    </View>
  );
}

function isSeatWinner(state: ScoreTrackerState, seat: SeatState): boolean {
  if (state.winnerSeatId && state.winnerSeatId === seat.id) return true;
  if (state.winnerTeam && seat.team === state.winnerTeam) return true;
  return false;
}

export function PlayScoreboard({
  state,
  rail,
  onAdjustPoints,
  onAdjustXp,
  onPressLegend,
}: PlayScoreboardProps) {
  const seats = state.seats;
  const formatId = state.format;
  const count = seats.length;

  if (count === 2) {
    const top = seats[0]!;
    const bottom = seats[1]!;
    return (
      <View className="min-h-0 flex-1">
        <SeatFrame
          className="min-h-0 flex-1"
          seat={top}
          seatIndex={0}
          formatId={formatId}
          isWinner={isSeatWinner(state, top)}
          rotation={180}
          onAdjustPoints={(delta) => onAdjustPoints(top.id, delta)}
          onAdjustXp={(delta) => onAdjustXp(top.id, delta)}
          onPressLegend={() => onPressLegend(top.id)}
        />
        {rail}
        <SeatFrame
          className="min-h-0 flex-1"
          seat={bottom}
          seatIndex={1}
          formatId={formatId}
          isWinner={isSeatWinner(state, bottom)}
          onAdjustPoints={(delta) => onAdjustPoints(bottom.id, delta)}
          onAdjustXp={(delta) => onAdjustXp(bottom.id, delta)}
          onPressLegend={() => onPressLegend(bottom.id)}
        />
      </View>
    );
  }

  if (count === 3) {
    const [a, b, c] = seats as [SeatState, SeatState, SeatState];
    return (
      <View className="min-h-0 flex-1">
        <View className="min-h-0 flex-1 flex-row">
          <SeatFrame
            className="min-h-0 min-w-0 flex-1"
            seat={a}
            seatIndex={0}
            formatId={formatId}
            isWinner={isSeatWinner(state, a)}
            rotation={180}
            compact
            onAdjustPoints={(delta) => onAdjustPoints(a.id, delta)}
            onAdjustXp={(delta) => onAdjustXp(a.id, delta)}
            onPressLegend={() => onPressLegend(a.id)}
          />
          <SeatFrame
            className="min-h-0 min-w-0 flex-1"
            seat={b}
            seatIndex={1}
            formatId={formatId}
            isWinner={isSeatWinner(state, b)}
            rotation={180}
            compact
            onAdjustPoints={(delta) => onAdjustPoints(b.id, delta)}
            onAdjustXp={(delta) => onAdjustXp(b.id, delta)}
            onPressLegend={() => onPressLegend(b.id)}
          />
        </View>
        {rail}
        <SeatFrame
          className="min-h-0 flex-1"
          seat={c}
          seatIndex={2}
          formatId={formatId}
          isWinner={isSeatWinner(state, c)}
          onAdjustPoints={(delta) => onAdjustPoints(c.id, delta)}
          onAdjustXp={(delta) => onAdjustXp(c.id, delta)}
          onPressLegend={() => onPressLegend(c.id)}
        />
      </View>
    );
  }

  const [a, b, c, d] = seats as [SeatState, SeatState, SeatState, SeatState];
  return (
    <View className="min-h-0 flex-1">
      <View className="min-h-0 flex-1 flex-row">
        <SeatFrame
          className="min-h-0 min-w-0 flex-1"
          seat={a}
          seatIndex={0}
          formatId={formatId}
          isWinner={isSeatWinner(state, a)}
          rotation={180}
          compact
          onAdjustPoints={(delta) => onAdjustPoints(a.id, delta)}
          onAdjustXp={(delta) => onAdjustXp(a.id, delta)}
          onPressLegend={() => onPressLegend(a.id)}
        />
        <SeatFrame
          className="min-h-0 min-w-0 flex-1"
          seat={b}
          seatIndex={1}
          formatId={formatId}
          isWinner={isSeatWinner(state, b)}
          rotation={180}
          compact
          onAdjustPoints={(delta) => onAdjustPoints(b.id, delta)}
          onAdjustXp={(delta) => onAdjustXp(b.id, delta)}
          onPressLegend={() => onPressLegend(b.id)}
        />
      </View>
      {rail}
      <View className="min-h-0 flex-1 flex-row">
        <SeatFrame
          className="min-h-0 min-w-0 flex-1"
          seat={c}
          seatIndex={2}
          formatId={formatId}
          isWinner={isSeatWinner(state, c)}
          compact
          onAdjustPoints={(delta) => onAdjustPoints(c.id, delta)}
          onAdjustXp={(delta) => onAdjustXp(c.id, delta)}
          onPressLegend={() => onPressLegend(c.id)}
        />
        <SeatFrame
          className="min-h-0 min-w-0 flex-1"
          seat={d}
          seatIndex={3}
          formatId={formatId}
          isWinner={isSeatWinner(state, d)}
          compact
          onAdjustPoints={(delta) => onAdjustPoints(d.id, delta)}
          onAdjustXp={(delta) => onAdjustXp(d.id, delta)}
          onPressLegend={() => onPressLegend(d.id)}
        />
      </View>
    </View>
  );
}
