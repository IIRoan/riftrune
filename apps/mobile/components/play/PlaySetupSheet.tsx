import { PlayLegendPicker } from '@/components/play/PlayLegendPicker';
import { ChevronLeftIcon } from '@/components/icons';
import { TypeIcon } from '@/components/riftbound/CardIcons';
import {
  AppSheet,
  AppSheetContent,
  AppSheetHeader,
  AppSheetOverlay,
  AppSheetPortal,
  AppSheetScrollView,
  AppSheetTitle,
} from '@/components/ui/app-sheet';
import { Text } from '@/components/ui/text';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import {
  PLAY_FORMATS,
  seatDisplayName,
  type PlayFormatId,
  type ScoreTrackerState,
  type SeatLegend,
} from '@/lib/score-tracker';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PlaySetupSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, open directly on that seat’s legend picker. */
  initialSeatId?: string | null;
  state: ScoreTrackerState;
  onSelectFormat: (formatId: PlayFormatId) => void;
  onSetLegend: (seatId: string, legend: SeatLegend | null) => void;
  onAdvanceMatch: () => void;
};

export function PlaySetupSheet({
  open,
  onOpenChange,
  initialSeatId = null,
  state,
  onSelectFormat,
  onSetLegend,
  onAdvanceMatch,
}: PlaySetupSheetProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [pickingSeatId, setPickingSeatId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPickingSeatId(initialSeatId);
    } else {
      setPickingSeatId(null);
    }
  }, [open, initialSeatId]);

  const format = PLAY_FORMATS.find((entry) => entry.id === state.format)!;
  const canAdvance = Boolean(format.trackMatchWins && state.winnerSeatId);
  const pickingSeat = state.seats.find((seat) => seat.id === pickingSeatId) ?? null;
  const snapPoints = ['92%'] as const;
  const defaultSnapIndex = 0;
  const paddingBottom = Math.max(insets.bottom, 16) + 24;

  return (
    <AppSheet open={open} onOpenChange={onOpenChange}>
      <AppSheetPortal name="play-setup">
        <AppSheetOverlay />
        <AppSheetContent
          snapPoints={[...snapPoints]}
          defaultSnapIndex={defaultSnapIndex}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
          enableContentPanningGesture
        >
          <AppSheetHeader>
            {pickingSeat ? (
              <View className="flex-row items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to play settings"
                  onPress={() => setPickingSeatId(null)}
                  className="size-9 items-center justify-center rounded-lg border border-border bg-card active:bg-card-panel"
                >
                  <ChevronLeftIcon size={18} className="text-foreground" />
                </Pressable>
                <AppSheetTitle>Choose legend</AppSheetTitle>
              </View>
            ) : (
              <AppSheetTitle>Play settings</AppSheetTitle>
            )}
          </AppSheetHeader>
          <AppSheetScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {pickingSeat ? (
              <PlayLegendPicker
                selectedVariantNumber={pickingSeat.legend?.variantNumber}
                onSelect={(legend) => {
                  onSetLegend(pickingSeat.id, legend);
                  onOpenChange(false);
                }}
                onClear={() => {
                  onSetLegend(pickingSeat.id, null);
                  onOpenChange(false);
                }}
              />
            ) : (
              <View className="gap-6">
                <View className="gap-2">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Format
                  </Text>
                  <View className="gap-2">
                    {PLAY_FORMATS.map((entry) => {
                      const selected = entry.id === state.format;
                      return (
                        <Pressable
                          key={entry.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => {
                            onSelectFormat(entry.id);
                            onOpenChange(false);
                          }}
                          className={cn(
                            'rounded-xl border px-4 py-3 active:opacity-90',
                            selected
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-card'
                          )}
                        >
                          <Text className="text-sm font-semibold text-foreground">
                            {entry.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View className="gap-2">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Legends
                  </Text>
                  {state.seats.map((seat, index) => (
                    <Pressable
                      key={seat.id}
                      accessibilityRole="button"
                      accessibilityLabel={
                        seat.legend
                          ? `Change legend for seat ${index + 1}, currently ${seatDisplayName(seat)}`
                          : `Set legend for seat ${index + 1}`
                      }
                      onPress={() => setPickingSeatId(seat.id)}
                      className="rounded-xl border border-border bg-card px-4 py-3 active:opacity-90"
                    >
                      <View className="flex-row items-center justify-between gap-3">
                        <View className="min-w-0 flex-1 flex-row items-center gap-3">
                          <View className="size-9 items-center justify-center rounded-full border border-border bg-background">
                            <TypeIcon type="Legend" size={18} tone="foreground" />
                          </View>
                          <View className="min-w-0 flex-1">
                            <Text
                              className="text-sm font-semibold text-foreground"
                              numberOfLines={1}
                            >
                              {seat.legend ? seatDisplayName(seat) : 'Choose legend'}
                            </Text>
                          </View>
                        </View>
                        <Text className="font-mono text-xs font-semibold text-primary">
                          {seat.legend ? 'Change' : 'Set'}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>

                {canAdvance ? (
                  <View className="gap-2">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Session
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        onAdvanceMatch();
                        onOpenChange(false);
                      }}
                      className="rounded-xl border border-primary bg-primary/15 px-4 py-3 active:opacity-90"
                    >
                      <Text className="text-sm font-semibold text-primary">Next game</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )}
          </AppSheetScrollView>
        </AppSheetContent>
      </AppSheetPortal>
    </AppSheet>
  );
}
