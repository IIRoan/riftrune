import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { Mode } from '@/components/auth/auth-types';

const WALLPAPERS = {
  'sign-in': require('@/assets/wallpapers/wallpaper2.jpg'),
  'sign-up': require('@/assets/wallpapers/wallpaper.jpg'),
} as const;

const TRANSITION_MS = 480;

type AuthBackdropProps = {
  mode: Mode;
  variant?: 'fullscreen' | 'contained';
};

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

export function AuthBackdrop({ mode, variant = 'fullscreen' }: AuthBackdropProps) {
  const reduceMotion = useReduceMotion();
  const signInOpacity = useSharedValue(mode === 'sign-in' ? 1 : 0);
  const signUpOpacity = useSharedValue(mode === 'sign-up' ? 1 : 0);
  const isContained = variant === 'contained';

  useEffect(() => {
    const duration = reduceMotion ? 0 : TRANSITION_MS;
    const easing = Easing.out(Easing.cubic);
    signInOpacity.value = withTiming(mode === 'sign-in' ? 1 : 0, { duration, easing });
    signUpOpacity.value = withTiming(mode === 'sign-up' ? 1 : 0, { duration, easing });
  }, [mode, reduceMotion, signInOpacity, signUpOpacity]);

  const signInStyle = useAnimatedStyle(() => ({
    opacity: signInOpacity.value,
  }));

  const signUpStyle = useAnimatedStyle(() => ({
    opacity: signUpOpacity.value,
  }));

  return (
    <View
      className="absolute inset-0 overflow-hidden"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        className="absolute inset-0"
        style={signInStyle}
        pointerEvents="none"
      >
        <Image
          source={WALLPAPERS['sign-in']}
          contentFit="cover"
          contentPosition={isContained ? 'center' : 'top center'}
          className="h-full w-full"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
      <Animated.View
        className="absolute inset-0"
        style={signUpStyle}
        pointerEvents="none"
      >
        <Image
          source={WALLPAPERS['sign-up']}
          contentFit="cover"
          contentPosition={isContained ? 'center' : 'top center'}
          className="h-full w-full"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
      <View className="absolute inset-0 bg-black/30" pointerEvents="none" />
      <Svg
        pointerEvents="none"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Defs>
          <LinearGradient id="auth-scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity={isContained ? '0.2' : '0.35'} />
            <Stop offset="0.55" stopColor="#000000" stopOpacity={isContained ? '0.45' : '0.62'} />
            <Stop offset="1" stopColor="#000000" stopOpacity={isContained ? '0.78' : '0.92'} />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#auth-scrim)" />
      </Svg>
    </View>
  );
}

export function useAuthWideLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 768;
}
