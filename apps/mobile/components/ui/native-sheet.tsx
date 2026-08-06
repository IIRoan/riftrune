import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type LayoutChangeEvent,
  type LayoutRectangle,
  Modal,
  Pressable,
  type PressableProps,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { Uniwind } from "uniwind";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import {
  OVERLAY,
  OVERLAY_CLOSE,
  SHEET_REDUCED,
  SHEET_SPRING,
} from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button, ButtonIcon } from "./button";
import { XIcon } from "@/components/icons";
import { Slot } from "./slot";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type NativeSheetContextProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  visibilityProgress: SharedValue<number>;
  contentLayout?: LayoutRectangle;
  setContentLayout: (layout?: LayoutRectangle) => void;
  reduceMotion: boolean;
};

type NativeSheetProps = Partial<NativeSheetContextProps> & {
  children: React.ReactNode;
};

type NativeSheetModalProps = Omit<
  React.ComponentProps<typeof Modal>,
  "onRequestClose" | "transparent" | "visible"
>;

type NativeSheetOverlayProps = {
  closeOnPress?: boolean;
  className?: string;
};

type NativeSheetContentProps = React.ComponentProps<typeof View>;

type NativeSheetTriggerProps = PressableProps & {
  asChild?: boolean;
};

type NativeSheetCloseProps = PressableProps & {
  asChild?: boolean;
};

const NativeSheetContext = createContext<NativeSheetContextProps | null>(null);

const useNativeSheet = () => {
  const context = useContext(NativeSheetContext);
  if (!context) {
    throw new Error("useNativeSheet must be used within a NativeSheet");
  }
  return context;
};

export const NativeSheet = ({
  open: openProp,
  onOpenChange: onOpenChangeProp,
  children,
}: NativeSheetProps) => {
  const [internalOpen, setInternalOpen] = useState(openProp ?? false);
  const [contentLayout, setContentLayout] = useState<LayoutRectangle>();
  const reduceMotion = useReduceMotion();

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const [visible, setVisible] = useState(open);
  const visibilityProgress = useSharedValue(0);
  const knownHeightRef = useRef(0);

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      setInternalOpen(nextOpen);
      onOpenChangeProp?.(nextOpen);
    },
    [onOpenChangeProp]
  );

  useEffect(() => {
    if (contentLayout?.height) {
      knownHeightRef.current = contentLayout.height;
    }
  }, [contentLayout?.height]);

  useEffect(() => {
    if (open) {
      setVisible(true);
      visibilityProgress.value = 0;
      // Re-open with a known height: spring immediately. First open waits for onLayout.
      if (knownHeightRef.current > 0) {
        const frame = requestAnimationFrame(() => {
          visibilityProgress.value = reduceMotion
            ? withTiming(1, SHEET_REDUCED)
            : withSpring(1, SHEET_SPRING);
        });
        return () => cancelAnimationFrame(frame);
      }
      return;
    }

    visibilityProgress.value = withTiming(0, OVERLAY_CLOSE, (finished) => {
      if (finished) {
        scheduleOnRN(setVisible, false);
      }
    });
  }, [open, reduceMotion, visibilityProgress]);

  const ctx = useMemo(
    () => ({
      open,
      onOpenChange,
      visibilityProgress,
      visible,
      setVisible,
      contentLayout,
      setContentLayout,
      reduceMotion,
    }),
    [
      open,
      contentLayout,
      visibilityProgress,
      visible,
      onOpenChange,
      reduceMotion,
    ]
  );

  return (
    <NativeSheetContext.Provider value={ctx}>
      {children}
    </NativeSheetContext.Provider>
  );
};

export const NativeSheetModal = ({
  supportedOrientations = ["portrait", "landscape"],
  ...props
}: NativeSheetModalProps & { children: React.ReactNode }) => {
  const { onOpenChange, visible } = useNativeSheet();

  if (!visible) {
    return null;
  }

  return (
    <Modal
      {...props}
      animationType="none"
      onRequestClose={() => onOpenChange(false)}
      supportedOrientations={supportedOrientations}
      transparent
      visible={visible}
    />
  );
};

export const NativeSheetOverlay = ({
  closeOnPress = true,
  className,
}: NativeSheetOverlayProps) => {
  const { onOpenChange, visibilityProgress, reduceMotion } = useNativeSheet();
  const isDark = Uniwind.currentTheme === "dark";
  const maxOpacity = isDark ? OVERLAY.backdropDark : OVERLAY.backdropLight;

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      visibilityProgress.value,
      [0, 1],
      [0, maxOpacity],
      Extrapolation.CLAMP
    );

    return {
      opacity: reduceMotion ? visibilityProgress.value * maxOpacity : opacity,
    };
  });

  return (
    <AnimatedPressable
      className={cn("absolute inset-0 bg-black", className)}
      disabled={!closeOnPress}
      onPress={() => onOpenChange(false)}
      style={animatedStyle}
    />
  );
};

export const NativeSheetContent = ({
  children,
  ...props
}: NativeSheetContentProps) => {
  const {
    open,
    visibilityProgress,
    contentLayout,
    setContentLayout,
    reduceMotion,
  } = useNativeSheet();

  const { bottom } = useSafeAreaInsets();

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout;
      setContentLayout(next);
      // First layout while opening — spring in from off-screen.
      if (open && visibilityProgress.value < 0.01 && next.height > 0) {
        visibilityProgress.value = reduceMotion
          ? withTiming(1, SHEET_REDUCED)
          : withSpring(1, SHEET_SPRING);
      }
    },
    [open, reduceMotion, setContentLayout, visibilityProgress]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!contentLayout) {
      return {
        opacity: 0,
        transform: [{ translateY: 0 }],
      };
    }

    if (reduceMotion) {
      return {
        opacity: visibilityProgress.value,
        transform: [{ translateY: 0 }],
      };
    }

    const translateY = interpolate(
      visibilityProgress.value,
      [0, 1],
      [contentLayout.height, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity: 1,
      transform: [{ translateY }],
    };
  });

  const isReady = Boolean(contentLayout?.height);

  return (
    <>
      {isReady ? (
        <Animated.View
          {...props}
          className={cn(
            "absolute inset-0 top-auto ios:rounded-t-xl bg-background",
            props.className
          )}
          onLayout={onLayout}
          style={[{ paddingBottom: bottom }, animatedStyle, props.style]}
        >
          {children}
        </Animated.View>
      ) : null}

      <Animated.View
        {...props}
        accessibilityElementsHidden
        accessible={false}
        className={cn("absolute opacity-0", props.className)}
        importantForAccessibility="no"
        onLayout={onLayout}
        pointerEvents="none"
        style={[{ paddingBottom: bottom }, props.style]}
      >
        {children}
      </Animated.View>
    </>
  );
};

export const NativeSheetBody = ({
  className,
  ...props
}: React.ComponentProps<typeof View>) => {
  return <View className={cn("flex-1 px-4", className)} {...props} />;
};

export const NativeSheetHeader = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof View>) => {
  return (
    <View
      className={cn("flex flex-row items-center gap-2 p-4", className)}
      {...props}
    >
      <View className="min-w-0 flex-1">{children}</View>
      <NativeSheetClose asChild>
        <Button className="shrink-0" size="icon" variant="link">
          <ButtonIcon className="text-foreground">
            <XIcon />
          </ButtonIcon>
        </Button>
      </NativeSheetClose>
    </View>
  );
};

export const NativeSheetTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof Text>) => {
  return (
    <Text
      className={cn(
        "font-semibold text-foreground text-xl leading-none",
        className
      )}
      {...props}
    />
  );
};

export const NativeSheetFooter = ({
  className,
  ...props
}: React.ComponentProps<typeof View>) => {
  return (
    <View
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
};

export const NativeSheetClose = ({
  asChild,
  ...props
}: NativeSheetCloseProps) => {
  const { onOpenChange } = useNativeSheet();

  const Comp = asChild ? Slot.Pressable : Pressable;

  return <Comp {...props} onPress={() => onOpenChange(false)} />;
};

export const NativeSheetTrigger = ({
  asChild,
  ...props
}: NativeSheetTriggerProps) => {
  const { onOpenChange } = useNativeSheet();

  const Comp = asChild ? Slot.Pressable : Pressable;

  return <Comp {...props} onPress={() => onOpenChange(true)} />;
};
