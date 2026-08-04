import {
  ArrowClockwiseIcon,
  ChevronLeftIcon,
  SettingsIcon,
} from '@/components/icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Pressable, View } from 'react-native';

type PlayCenterRailProps = {
  formatLabel: string;
  formatDescription: string;
  showNextGame?: boolean;
  onLeave: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
  onNextGame?: () => void;
};

function RailButton({
  label,
  onPress,
  children,
  className,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'size-10 items-center justify-center rounded-full border border-border bg-background active:bg-accent',
        className
      )}
    >
      {children}
    </Pressable>
  );
}

/** Shared strip between seat halves — controls sit mid-left so both players can reach them. */
export function PlayCenterRail({
  formatLabel,
  formatDescription,
  showNextGame = false,
  onLeave,
  onReset,
  onOpenSettings,
  onNextGame,
}: PlayCenterRailProps) {
  return (
    <View className="z-20 flex-row items-center gap-2 border-y border-border bg-card px-2 py-1.5">
      <View className="flex-row items-center gap-1.5">
        <RailButton label="Leave scoreboard" onPress={onLeave}>
          <ChevronLeftIcon size={18} className="text-foreground" />
        </RailButton>
        <RailButton label="Reset game points" onPress={onReset}>
          <ArrowClockwiseIcon size={18} className="text-foreground" />
        </RailButton>
        <RailButton label="Open play settings" onPress={onOpenSettings}>
          <SettingsIcon size={18} className="text-foreground" />
        </RailButton>
        {showNextGame && onNextGame ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start next game"
            onPress={onNextGame}
            className="rounded-full border border-primary bg-primary/20 px-3 py-2 active:opacity-80"
          >
            <Text className="text-xs font-semibold text-primary">Next</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="min-w-0 flex-1 items-end pr-1">
        <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
          {formatLabel}
        </Text>
        <Text
          className="font-mono text-[10px] text-muted-foreground"
          numberOfLines={1}
        >
          {formatDescription}
        </Text>
      </View>
    </View>
  );
}
