import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { cn } from '@/lib/utils';

const HANDOFF_MS = 120;
const EASE_OUT = Easing.out(Easing.cubic);

interface CatalogResultsTransitionProps {
  /** Changes when sort or filter state should replay the list handoff. */
  transitionKey: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * Light opacity pulse when catalog sort/filter state changes — enough to
 * acknowledge the reorder without dimming the grid into a laggy fade.
 */
export function CatalogResultsTransition({
  transitionKey,
  className,
  style,
  children,
}: CatalogResultsTransitionProps) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = 0.88;
    opacity.value = withTiming(1, { duration: HANDOFF_MS, easing: EASE_OUT });
  }, [opacity, reduceMotion, transitionKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View className={cn('min-h-0 flex-1', className)} style={[style, animatedStyle]}>
      <View className="min-h-0 flex-1">{children}</View>
    </Animated.View>
  );
}
