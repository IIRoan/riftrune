import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface VariantFamilySwitcherProps {
  label: string;
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function VariantFamilySwitcher({
  label,
  currentIndex,
  total,
  onPrevious,
  onNext,
}: VariantFamilySwitcherProps) {
  const canPrevious = currentIndex > 0;
  const canNext = currentIndex < total - 1;

  return (
    <View className="mt-2 flex-row items-center gap-2">
      <Pressable
        accessibilityLabel="Previous printing version"
        accessibilityRole="button"
        disabled={!canPrevious}
        onPress={onPrevious}
        className={cn(
          'size-7 items-center justify-center rounded-md border border-border active:bg-accent',
          !canPrevious && 'opacity-30'
        )}
      >
        <Ionicons name="chevron-back" size={16} className="text-muted-foreground" />
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
          'size-7 items-center justify-center rounded-md border border-border active:bg-accent',
          !canNext && 'opacity-30'
        )}
      >
        <Ionicons name="chevron-forward" size={16} className="text-muted-foreground" />
      </Pressable>
    </View>
  );
}
