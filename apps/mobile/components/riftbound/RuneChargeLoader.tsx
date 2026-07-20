import { Image } from 'expo-image';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';
import { runeIcon } from '@/constants/gameAssets';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { cn } from '@/lib/utils';

const SIZE_PX = {
  sm: 22,
  md: 40,
  lg: 64,
  xl: 96,
} as const;

export type RuneChargeSize = keyof typeof SIZE_PX;

type RuneChargeLoaderProps = {
  size?: RuneChargeSize;
  className?: string;
  accessibilityLabel?: string;
};

const FILL_MS = 1400;

/**
 * Minimal rune loader — empty glyph fills with color, then eases back.
 */
export function RuneChargeLoader({
  size = 'md',
  className,
  accessibilityLabel = 'Loading',
}: RuneChargeLoaderProps) {
  const reduceMotion = useReduceMotion();
  const px = SIZE_PX[size];
  const glyph = Math.round(px * 0.86);

  const [muted] = useCSSVariable(['--color-muted-foreground']) as (string | undefined)[];
  const emptyTint = muted ?? '#888888';

  const fill = useSharedValue(reduceMotion ? 0.55 : 0);

  useEffect(() => {
    if (reduceMotion) {
      fill.value = 0.55;
      return;
    }
    fill.value = 0;
    fill.value = withRepeat(
      withTiming(1, { duration: FILL_MS, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true
    );
  }, [fill, reduceMotion]);

  const clipStyle = useAnimatedStyle(() => ({
    height: Math.max(0, glyph * fill.value),
  }));

  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: px, height: px }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
    >
      <View style={{ width: glyph, height: glyph }}>
        {/* Empty / drained rune */}
        <Image
          source={runeIcon}
          style={{
            position: 'absolute',
            width: glyph,
            height: glyph,
            opacity: 0.28,
            tintColor: emptyTint,
          }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />

        {/* Color fill rising from the bottom */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
            },
            clipStyle,
          ]}
        >
          <View
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: glyph,
              height: glyph,
            }}
          >
            <Image
              source={runeIcon}
              style={{ width: glyph, height: glyph }}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
