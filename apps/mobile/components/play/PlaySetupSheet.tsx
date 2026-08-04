import { PlayLegendPicker } from '@/components/play/PlayLegendPicker';
import { CheckIcon, ChevronLeftIcon, ThemedIcon } from '@/components/icons';
import {
  AppSheet,
  AppSheetBody,
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
  type PlayFormatId,
  type ScoreTrackerState,
  type SeatLegend,
} from '@/lib/score-tracker';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PlaySetupSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, open directly on that seat’s legend picker (not from settings). */
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
  /** Float the sheet above the home indicator so the last row is never flush. */
  const sheetBottomInset = Math.max(insets.bottom, 12) + 8;

  return (
    <AppSheet open={open} onOpenChange={onOpenChange}>
      <AppSheetPortal name="play-setup">
        <AppSheetOverlay />
        <AppSheetContent
          {...(pickingSeat
            ? { snapPoints: ['92%'] as string[], defaultSnapIndex: 0 }
            : { enableDynamicSizing: true })}
          bottomInset={sheetBottomInset}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
          enableContentPanningGesture
        >
          <AppSheetHeader>
            {pickingSeat ? (
              <View className="flex-row items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close legend picker"
                  onPress={() => onOpenChange(false)}
                  hitSlop={8}
                  className="size-10 items-center justify-center active:opacity-70"
                >
                  <ChevronLeftIcon size={20} className="text-foreground" />
                </Pressable>
                <View className="min-w-0 flex-1 gap-0.5">
                  <AppSheetTitle>Choose legend</AppSheetTitle>
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    Seat art and name on the scoreboard
                  </Text>
                </View>
              </View>
            ) : (
              <View className="gap-1">
                <AppSheetTitle>Play settings</AppSheetTitle>
                <Text className="text-sm leading-snug text-muted-foreground">
                  How this table scores
                </Text>
              </View>
            )}
          </AppSheetHeader>

          {pickingSeat ? (
            <AppSheetScrollView
              className="flex-1"
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom, 16) + 24,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
            </AppSheetScrollView>
          ) : (
            <AppSheetBody className="gap-7 pb-2">
              <View>
                {PLAY_FORMATS.map((entry, index) => {
                  const selected = entry.id === state.format;
                  const isLast = index === PLAY_FORMATS.length - 1;
                  return (
                    <Pressable
                      key={entry.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${entry.label}. ${entry.description}`}
                      onPress={() => {
                        void hapticPress();
                        onSelectFormat(entry.id);
                        onOpenChange(false);
                      }}
                      className={cn(
                        'min-h-14 flex-row items-center gap-3 py-3.5 active:bg-accent/60',
                        !isLast && 'border-b border-border'
                      )}
                    >
                      <View className="min-w-0 flex-1 gap-0.5">
                        <Text
                          className={cn(
                            'text-base font-semibold',
                            selected ? 'text-primary' : 'text-foreground'
                          )}
                        >
                          {entry.label}
                        </Text>
                        <Text className="text-sm leading-snug text-muted-foreground">
                          {entry.description}
                        </Text>
                      </View>
                      {selected ? (
                        <ThemedIcon icon={CheckIcon} size={20} color="archive-accent-text" />
                      ) : (
                        <View className="size-5" />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {canAdvance ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Start next game"
                  onPress={() => {
                    void hapticPress();
                    onAdvanceMatch();
                    onOpenChange(false);
                  }}
                  className="min-h-14 justify-center border-t border-border pt-4 active:opacity-80"
                >
                  <Text className="text-base font-semibold text-primary">Next game</Text>
                  <Text className="mt-0.5 text-sm leading-snug text-muted-foreground">
                    Credit the winner and clear the board for the next game
                  </Text>
                </Pressable>
              ) : null}
            </AppSheetBody>
          )}
        </AppSheetContent>
      </AppSheetPortal>
    </AppSheet>
  );
}
