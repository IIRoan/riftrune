import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { Layout } from '@/constants/Layout';
import { cn } from '@/lib/utils';

interface VariantFamilySwitcherProps {
  label: string;
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  /** Larger chevron hit targets for mobile drawer (≥44px). */
  prominent?: boolean;
}

export function VariantFamilySwitcher({
  label,
  currentIndex,
  total,
  onPrevious,
  onNext,
  prominent = false,
}: VariantFamilySwitcherProps) {
  const canPrevious = currentIndex > 0;
  const canNext = currentIndex < total - 1;
  const navSize = prominent ? Layout.minTouchTarget : 28;
  const iconSize = prominent ? 18 : 16;

  return (
    <View className={cn('flex-row items-center gap-2', !prominent && 'mt-2')}>
      <Pressable
        accessibilityLabel="Previous printing version"
        accessibilityRole="button"
        disabled={!canPrevious}
        onPress={onPrevious}
        className={cn(
          'items-center justify-center rounded-md border border-border active:bg-accent',
          prominent ? 'size-11' : 'size-7',
          !canPrevious && 'opacity-30'
        )}
        style={prominent ? { minWidth: navSize, minHeight: navSize } : undefined}
      >
        <ThemedIonicon name="chevron-back" size={iconSize} color="muted-foreground" />
      </Pressable>

      <View className="min-w-0 flex-1 items-center px-1">
        <Text className="text-center text-sm font-semibold text-foreground" numberOfLines={2}>
          {label}
        </Text>
        {total > 1 ? (
          <Text className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {currentIndex + 1} of {total}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel="Next printing version"
        accessibilityRole="button"
        disabled={!canNext}
        onPress={onNext}
        className={cn(
          'items-center justify-center rounded-md border border-border active:bg-accent',
          prominent ? 'size-11' : 'size-7',
          !canNext && 'opacity-30'
        )}
        style={prominent ? { minWidth: navSize, minHeight: navSize } : undefined}
      >
        <ThemedIonicon name="chevron-forward" size={iconSize} color="muted-foreground" />
      </Pressable>
    </View>
  );
}
