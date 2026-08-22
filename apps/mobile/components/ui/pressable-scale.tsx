import { useReduceMotion } from '@/hooks/useReduceMotion';
import { PRESS } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useCallback, type ComponentProps, type ReactNode } from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type PressableScaleProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children: ReactNode;
  className?: string;
  depth?: number;
  contentClassName?: string;
};

export function PressableScale({
  children,
  className,
  contentClassName,
  depth = PRESS.depth,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: PressableScaleProps) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (!disabled) {
        if (reduceMotion) {
          opacity.value = withTiming(0.72, { duration: PRESS.inMs });
        } else {
          scale.value = withTiming(depth, { duration: PRESS.inMs });
        }
      }
      onPressIn?.(event);
    },
    [depth, disabled, onPressIn, opacity, reduceMotion, scale]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (reduceMotion) {
        opacity.value = withTiming(1, { duration: 160 });
      } else {
        scale.value = withSpring(1, PRESS.outSpring);
      }
      onPressOut?.(event);
    },
    [onPressOut, opacity, reduceMotion, scale]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={className}
      {...props}
    >
      <Animated.View className={cn(contentClassName)} style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
