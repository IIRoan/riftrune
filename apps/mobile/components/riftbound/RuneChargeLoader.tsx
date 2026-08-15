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
import { RUNE_SIZE_PX, type RuneChargeSize } from '@/lib/rune-size';
import { cn } from '@/lib/utils';

export {
  RUNE_SIZE_PX,
  runeSizeForShortSide,
  type RuneChargeSize,
} from '@/lib/rune-size';

type RuneChargeLoaderProps = {
  size?: RuneChargeSize;
  className?: string;
  accessibilityLabel?: string;
  /** 0–1 fill. When set, the rune tracks this instead of looping. */
  progress?: number;
};

const FILL_MS = 1400;

/**
 * Minimal rune loader — empty glyph fills with color, then eases back.
 */
export function RuneChargeLoader({
  size = 'md',
  className,
  accessibilityLabel = 'Loading',
  progress,
}: RuneChargeLoaderProps) {
  const reduceMotion = useReduceMotion();
  const px = RUNE_SIZE_PX[size];
  const glyph = Math.round(px * 0.86);
  const tracked =
    progress === undefined ? undefined : Math.max(0, Math.min(1, progress));

  const [muted] = useCSSVariable(['--color-muted-foreground']) as (
    string | undefined
  )[];
  const emptyTint = muted ?? '#888888';

  const fill = useSharedValue(tracked ?? (reduceMotion ? 0.55 : 0));

  useEffect(() => {
    if (tracked !== undefined) {
      fill.value = reduceMotion
        ? tracked
        : withTiming(tracked, { duration: 180, easing: Easing.out(Easing.cubic) });
      return;
    }
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
  }, [fill, reduceMotion, tracked]);

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
      accessibilityValue={
        tracked === undefined
          ? undefined
          : { min: 0, max: 100, now: Math.round(tracked * 100) }
      }
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
